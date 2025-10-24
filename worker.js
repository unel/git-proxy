import { getContentTypeFromExtension, isTextContentType } from './utils/mime.js';
import { buildGitHubRawUrl, parseFilePath } from './utils/github.js';
import { getCorsHeaders, getContentTypeHeader } from './utils/headers.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Проксировать только запросы по нужному пути, например /files/
        if (!url.pathname.startsWith('/files/')) {
            return new Response('Not Found', { status: 404 });
        }

        // Вырезаем путь к файлу после /files/
        const filePath = url.pathname.replace('/files/', '');

        // Парсим путь и получаем параметры репозитория
        const { owner, repo, branch, filePath: cleanFilePath } = parseFilePath(filePath);

        // Формируем URL raw файла в GitHub
        const githubRawUrl = buildGitHubRawUrl(owner, repo, branch, cleanFilePath);

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

        // Возвращаем ответ
        return new Response(body, {
            status: 200,
            headers,
        });
    }
};