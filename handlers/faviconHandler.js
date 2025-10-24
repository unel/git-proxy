import { faviconSVG } from '../public/favicon.js';

/**
 * Обработчик для фавиконки
 */
export async function handleFavicon() {
    return new Response(faviconSVG, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400', // кешируем на сутки
        },
    });
}

/**
 * Обработчик редиректа с .ico на .svg
 */
export async function handleFaviconRedirect(request) {
    const url = new URL(request.url);
    return Response.redirect(new URL('/favicon.svg', url.origin), 301);
}
