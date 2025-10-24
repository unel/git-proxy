import { handlePreflight } from './handlers/preflightHandler.js';
import { handleFileRequest } from './handlers/fileHandler.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Обработка CORS preflight запросов
        if (request.method === 'OPTIONS') {
            return handlePreflight();
        }

        // Проксировать только запросы по нужному пути, например /files/
        if (!url.pathname.startsWith('/files/')) {
            return new Response('Not Found', { status: 404 });
        }

        // Обработка запроса на получение файла
        return handleFileRequest(request, env, ctx);
    }
};