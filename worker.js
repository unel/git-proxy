import { handlePreflight } from './handlers/preflightHandler.js';
import { handleFileRequest } from './handlers/fileHandler.js';

// URLPattern для маршрутизации запросов к файлам
// Используем несколько паттернов для всех комбинаций owner/repo
const filePatterns = [
    new URLPattern({ pathname: '/files/o/:owner/r/:repo/:path*' }), // owner + repo
    new URLPattern({ pathname: '/files/r/:repo/:path*' }),           // только repo
    new URLPattern({ pathname: '/files/:path*' }),                   // дефолтные значения
];

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Обработка CORS preflight запросов
        if (request.method === 'OPTIONS') {
            return handlePreflight();
        }

        // Проверяем соответствие пути одному из паттернов
        for (const pattern of filePatterns) {
            const match = pattern.exec(url);
            if (match) {
                // Обработка запроса на получение файла, передаём распарсенные параметры
                return handleFileRequest(request, env, ctx, match.pathname.groups);
            }
        }

        // Для всех остальных путей отдаём HTML-заглушку с подстановкой переменных окружения
        const { default: indexHTML } = await import('./public/index.html');

        // Подставляем текущие значения переменных окружения
        const defaultOwner = env.DEFAULT_OWNER || 'unel';
        const defaultRepo = env.DEFAULT_REPO || 'git-proxy';
        const defaultBranch = env.DEFAULT_BRANCH || 'main';

        const processedHTML = indexHTML
            .replace(/\{\{DEFAULT_OWNER\}\}/g, defaultOwner)
            .replace(/\{\{DEFAULT_REPO\}\}/g, defaultRepo)
            .replace(/\{\{DEFAULT_BRANCH\}\}/g, defaultBranch);

        return new Response(processedHTML, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    }
};