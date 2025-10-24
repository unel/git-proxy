import { getContentTypeFromExtension, isTextContentType } from '../utils/mime.js';
import { buildGitHubRawUrl, parseFilePath } from '../utils/github.js';
import { getCorsHeaders, getContentTypeHeader } from '../utils/headers.js';

// Обработка запроса на получение файла
export async function handleFileRequest(request, env, ctx, pathParams) {
    // Проверяем кэш
    const cache = caches.default;
    let response = await cache.match(request);

    if (response) {
        // Возвращаем закэшированный ответ
        return response;
    }

    // Используем параметры из URLPattern: owner, repo, path
    const { owner, repo, path } = pathParams;

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
    } = parseFilePath(path, owner || defaultOwner, repo || defaultRepo, defaultBranch);

    // Формируем URL raw файла в GitHub
    const githubRawUrl = buildGitHubRawUrl(finalOwner, finalRepo, branch, cleanFilePath);

    // Запрашиваем файл из GitHub
    const githubResponse = await fetch(githubRawUrl);

    if (!githubResponse.ok) {
        return new Response('File Not Found', { status: 404 });
    }

    // Используем Content-Type от GitHub, с fallback на расширение
    const githubContentType = githubResponse.headers.get('Content-Type');
    const contentType = githubContentType
        ? githubContentType.split(';')[0].trim() // убираем параметры типа charset
        : getContentTypeFromExtension(cleanFilePath);

    // Получаем тело ответа без лишних перекодировок
    const body = await githubResponse.arrayBuffer();

    // Формируем заголовки ответа
    const headers = {
        'Content-Type': getContentTypeHeader(contentType, isTextContentType(contentType)),
        ...getCorsHeaders(),
    };

    // Добавляем метаданные от GitHub
    const contentLength = githubResponse.headers.get('Content-Length');
    if (contentLength) {
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

    // Устанавливаем Cache-Control для клиента и CDN
    // Публичный кэш на 1 час, stale-while-revalidate на 1 день
    headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

    // Создаём ответ
    response = new Response(body, {
        status: 200,
        headers,
    });

    // Сохраняем в кэш в фоне (гарантируется выполнение через waitUntil)
    // Cache API автоматически использует Cache-Control заголовки
    ctx.waitUntil(cache.put(request, response.clone()));

    // Возвращаем ответ
    return response;
}