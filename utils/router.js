/**
 * Простая система роутинга для Worker
 *
 * Маршруты определяются как массив [patterns, handler], где:
 * - patterns: URLPattern или массив URLPattern
 * - handler: функция-обработчик
 */

/**
 * Находит подходящий маршрут и вызывает его обработчик
 * @param {Array} routes - Массив маршрутов [[patterns, handler], ...]
 * @param {Request} request - HTTP запрос
 * @param {Object} env - Переменные окружения
 * @param {Object} ctx - Контекст выполнения
 * @returns {Promise<Response|null>} - Response или null если маршрут не найден
 */
export async function matchRoute(routes, request, env, ctx) {
    const url = new URL(request.url);

    for (const [patterns, handler] of routes) {
        // Поддержка как одного паттерна, так и массива паттернов
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];

        for (const pattern of patternArray) {
            const match = pattern.exec(url);
            if (match) {
                // Передаём параметры из URL в обработчик
                const params = match.pathname.groups || {};

                // Добавляем query параметры
                const queryParams = Object.fromEntries(url.searchParams.entries());

                return await handler(request, env, ctx, { ...params, ...queryParams });
            }
        }
    }

    return null;
}
