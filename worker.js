import { handlePreflight } from './handlers/preflightHandler.js';
import { handleIndex } from './handlers/indexHandler.js';
import { createErrorResponse, ErrorType } from './utils/errors.js';
import { matchRoute } from './utils/router.js';
import { routes } from './routes.js';

export default {
    async fetch(request, env, ctx) {
        try {
            // Обработка CORS preflight запросов
            if (request.method === 'OPTIONS') {
                return handlePreflight();
            }

            // Проверяем только GET запросы
            if (request.method !== 'GET') {
                return createErrorResponse(ErrorType.BAD_REQUEST, `Method ${request.method} not allowed`);
            }

            // Пытаемся найти подходящий маршрут
            const response = await matchRoute(routes, request, env, ctx);
            if (response) {
                return response;
            }

            // Если ничего не нашли - отдаём главную страницу
            return handleIndex(request, env);

        } catch (error) {
            // Логируем критические ошибки
            console.error('Critical error in worker:', error);

            // Возвращаем общую ошибку сервера
            return createErrorResponse(ErrorType.INTERNAL_ERROR, error.message);
        }
    }
};
