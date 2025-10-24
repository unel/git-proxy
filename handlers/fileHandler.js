import { getContentTypeFromExtension, isTextContentType } from '../utils/mime.js';
import { buildGitHubRawUrl, parseFilePath, getCacheControlForRef } from '../utils/github.js';
import { getCorsHeaders, getContentTypeHeader } from '../utils/headers.js';
import { createErrorResponse, getErrorTypeFromGitHubResponse } from '../utils/errors.js';
import { tryCompress } from '../utils/compression.js';

// Обработка запроса на получение файла
export async function handleFileRequest(request, env, ctx, params) {
    try {
        // Проверяем кэш
        const cache = caches.default;
        let response = await cache.match(request);

        if (response) {
            // Возвращаем закэшированный ответ
            return response;
        }

        // Извлекаем параметры: owner, repo, path из URL и ref из query
        const { owner, repo, path, ref } = params;

        // Получаем дефолтные значения из переменных окружения
        const defaultOwner = env.DEFAULT_OWNER || 'unel';
        const defaultRepo = env.DEFAULT_REPO || 'git-proxy';
        const defaultBranch = env.DEFAULT_BRANCH || 'main';

        // Парсим путь и получаем параметры репозитория (owner, repo, branch с дефолтами)
        const {
            owner: finalOwner,
            repo: finalRepo,
            branch,
            filePath: cleanFilePath
        } = parseFilePath(path, owner || defaultOwner, repo || defaultRepo, defaultBranch, ref);

        // Формируем URL raw файла в GitHub
        const githubRawUrl = buildGitHubRawUrl(finalOwner, finalRepo, branch, cleanFilePath);

        // Запрашиваем файл из GitHub
        const githubResponse = await fetch(githubRawUrl);

        if (!githubResponse.ok) {
            // Определяем тип ошибки на основе ответа GitHub
            const errorType = getErrorTypeFromGitHubResponse(githubResponse);
            const details = `${finalOwner}/${finalRepo}/${branch}/${cleanFilePath}`;
            return createErrorResponse(errorType, details);
        }

        // Используем Content-Type от GitHub, с fallback на расширение
        const githubContentType = githubResponse.headers.get('Content-Type');
        const contentType = githubContentType
            ? githubContentType.split(';')[0].trim() // убираем параметры типа charset
            : getContentTypeFromExtension(cleanFilePath);

        // Получаем тело ответа без лишних перекодировок
        const body = await githubResponse.arrayBuffer();

        // Определяем, является ли контент текстовым
        const isText = isTextContentType(contentType);

        // Пытаемся сжать контент (если это текст и клиент поддерживает компрессию)
        const acceptEncoding = request.headers.get('Accept-Encoding') || '';
        const { body: finalBody, encoding: contentEncoding } = await tryCompress(
            body,
            acceptEncoding,
            contentType,
            isText
        );

        // Формируем заголовки ответа
        const headers = {
            'Content-Type': getContentTypeHeader(contentType, isText),
            'Content-Disposition': 'inline', // Открывать в браузере, а не скачивать
            ...getCorsHeaders(),
        };

        // Добавляем Content-Encoding если контент был сжат
        if (contentEncoding) {
            headers['Content-Encoding'] = contentEncoding;
        }

        // Добавляем метаданные от GitHub
        const contentLength = githubResponse.headers.get('Content-Length');
        // Content-Length добавляем только если контент не был сжат
        if (contentLength && !contentEncoding) {
            headers['Content-Length'] = contentLength;
        }

        const etag = githubResponse.headers.get('ETag');
        if (etag) {
            headers['ETag'] = etag;
        }

        const lastModified = githubResponse.headers.get('Last-Modified');
        if (lastModified) {
            headers['Last-Modified'] = lastModified;
        }

        // Устанавливаем динамический Cache-Control в зависимости от типа ref:
        // - commit SHA: 1 год (иммутабелен)
        // - tag: 1 неделя (редко меняется)
        // - branch: 5 минут (часто обновляется)
        headers['Cache-Control'] = getCacheControlForRef(ref);

        // Создаём ответ
        response = new Response(finalBody, {
            status: 200,
            headers,
        });

        // Сохраняем в кэш в фоне (гарантируется выполнение через waitUntil)
        // Cache API автоматически использует Cache-Control заголовки
        ctx.waitUntil(cache.put(request, response.clone()));

        // Возвращаем ответ
        return response;
    } catch (error) {
        // Логируем ошибку для отладки
        console.error('Error in handleFileRequest:', error);

        // Возвращаем общую ошибку сервера
        return createErrorResponse('INTERNAL_ERROR', error.message);
    }
}