import { handlePreflight } from './handlers/preflightHandler.js';
import { handleFileRequest } from './handlers/fileHandler.js';
import { createErrorResponse, ErrorType } from './utils/errors.js';

// URLPattern для маршрутизации запросов к файлам
// Используем несколько паттернов для всех комбинаций owner/repo
const filePatterns = [
    new URLPattern({ pathname: '/files/o/:owner/r/:repo/:path*' }), // owner + repo
    new URLPattern({ pathname: '/files/r/:repo/:path*' }),           // только repo
    new URLPattern({ pathname: '/files/:path*' }),                   // дефолтные значения
];

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);

            // Обработка CORS preflight запросов
            if (request.method === 'OPTIONS') {
                return handlePreflight();
            }

            // Проверяем только GET запросы для файлов
            if (request.method !== 'GET') {
                return createErrorResponse(ErrorType.BAD_REQUEST, `Method ${request.method} not allowed`);
            }

            // Проверяем соответствие пути одному из паттернов
            for (const pattern of filePatterns) {
                const match = pattern.exec(url);
                if (match) {
                    // Собираем все параметры запроса
                    const params = {
                        ...match.pathname.groups,
                        ref: url.searchParams.get('ref'), // branch, commit SHA или tag
                    };

                    // Обработка запроса на получение файла
                    return handleFileRequest(request, env, ctx, params);
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
        } catch (error) {
            // Логируем критические ошибки
            console.error('Critical error in worker:', error);

            // Возвращаем общую ошибку сервера
            return createErrorResponse(ErrorType.INTERNAL_ERROR, error.message);
        }
    }
};