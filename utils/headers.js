// Получение базовых CORS заголовков
export function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 часа кэширования preflight
    };
}

// Формирование полного Content-Type с charset при необходимости
export function getContentTypeHeader(contentType, includeCharset) {
    return includeCharset
        ? `${contentType}; charset=utf-8`
        : contentType;
}