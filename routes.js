import { handleFileRequest } from './handlers/fileHandler.js';
import { handleFavicon, handleFaviconRedirect } from './handlers/faviconHandler.js';

/**
 * Определение маршрутов приложения
 *
 * Формат: [[patterns, handler], ...]
 * где patterns может быть одним URLPattern или массивом URLPattern
 */
export const routes = [
    // Фавиконки
    [
        new URLPattern({ pathname: '/favicon.ico' }),
        handleFaviconRedirect
    ],
    [
        new URLPattern({ pathname: '/favicon.svg' }),
        handleFavicon
    ],

    // API для получения файлов (несколько паттернов на один обработчик)
    [
        [
            new URLPattern({ pathname: '/files/o/:owner/r/:repo/:path*' }), // owner + repo
            new URLPattern({ pathname: '/files/r/:repo/:path*' }),           // только repo
            new URLPattern({ pathname: '/files/:path*' }),                   // дефолтные значения
        ],
        async (request, env, ctx, params) => {
            // Добавляем ref из query параметров
            params.ref = params.ref || null;
            return handleFileRequest(request, env, ctx, params);
        }
    ],
];
