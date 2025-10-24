import { getCorsHeaders } from './headers.js';

/**
 * HTTP статус-коды для различных типов ошибок
 */
export const HttpStatus = {
    OK: 200,
    NO_CONTENT: 204,
    NOT_MODIFIED: 304,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    IM_A_TEAPOT: 418,
    TOO_MANY_REQUESTS: 429,
    UNAVAILABLE_FOR_LEGAL_REASONS: 451,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
};

/**
 * Типы ошибок для структурированной обработки
 */
export const ErrorType = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    GITHUB_API_ERROR: 'GITHUB_API_ERROR',
    RATE_LIMIT: 'RATE_LIMIT',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TEAPOT: 'TEAPOT',
    CENSORED: 'CENSORED',
};

/**
 * Маппинг типов ошибок на статус-коды и сообщения
 */
const errorConfig = {
    [ErrorType.FILE_NOT_FOUND]: {
        status: HttpStatus.NOT_FOUND,
        code: 'FILE_NOT_FOUND',
        message: 'Файл не найден в репозитории',
    },
    [ErrorType.GITHUB_API_ERROR]: {
        status: HttpStatus.BAD_GATEWAY,
        code: 'GITHUB_API_ERROR',
        message: 'Ошибка GitHub API',
    },
    [ErrorType.RATE_LIMIT]: {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Превышен лимит запросов к GitHub API',
    },
    [ErrorType.FORBIDDEN]: {
        status: HttpStatus.FORBIDDEN,
        code: 'ACCESS_FORBIDDEN',
        message: 'Доступ запрещён',
    },
    [ErrorType.BAD_REQUEST]: {
        status: HttpStatus.BAD_REQUEST,
        code: 'BAD_REQUEST',
        message: 'Некорректные параметры запроса',
    },
    [ErrorType.INTERNAL_ERROR]: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Внутренняя ошибка сервера',
    },
    [ErrorType.TEAPOT]: {
        status: HttpStatus.IM_A_TEAPOT,
        code: 'TEAPOT',
        message: 'Short and stout',
    },
    [ErrorType.CENSORED]: {
        status: HttpStatus.UNAVAILABLE_FOR_LEGAL_REASONS,
        code: 'CENSORED',
        message: '[ДАННЫЕ УДАЛЕНЫ]',
    },
};

/**
 * Создаёт JSON ответ с ошибкой
 * @param {string} errorType - Тип ошибки из ErrorType
 * @param {string} [details] - Дополнительные детали ошибки
 * @param {number} [customStatus] - Кастомный статус-код (опционально)
 * @returns {Response} - HTTP Response с ошибкой
 */
export function createErrorResponse(errorType, details = null, customStatus = null) {
    const config = errorConfig[errorType] || errorConfig[ErrorType.INTERNAL_ERROR];
    const status = customStatus || config.status;

    const errorBody = {
        error: config.message,
        errorCode: config.code,
        ...(details && { details }),
    };

    return new Response(JSON.stringify(errorBody, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...getCorsHeaders(),
        },
    });
}

/**
 * Определяет тип ошибки на основе ответа GitHub API
 * @param {Response} githubResponse - Ответ от GitHub API
 * @returns {string} - Тип ошибки из ErrorType
 */
export function getErrorTypeFromGitHubResponse(githubResponse) {
    const status = githubResponse.status;

    switch (status) {
        case 404:
            return ErrorType.FILE_NOT_FOUND;
        case 403:
            // Проверяем заголовки на rate limit
            const rateLimitRemaining = githubResponse.headers.get('X-RateLimit-Remaining');
            if (rateLimitRemaining === '0') {
                return ErrorType.RATE_LIMIT;
            }
            return ErrorType.FORBIDDEN;
        case 400:
            return ErrorType.BAD_REQUEST;
        case 500:
        case 502:
        case 503:
            return ErrorType.GITHUB_API_ERROR;
        default:
            return ErrorType.GITHUB_API_ERROR;
    }
}

/**
 * Создаёт простой текстовый ответ с ошибкой (для обратной совместимости)
 * @param {string} message - Сообщение об ошибке
 * @param {number} status - HTTP статус-код
 * @returns {Response} - HTTP Response с ошибкой
 */
export function createSimpleErrorResponse(message, status) {
    return new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...getCorsHeaders(),
        },
    });
}