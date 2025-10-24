import { getCorsHeaders } from '../utils/headers.js';

// Обработка CORS preflight запроса (OPTIONS)
export function handlePreflight() {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(),
    });
}