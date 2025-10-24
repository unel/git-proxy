// Функция определения Content-Type по расширению файла (fallback)
export function getContentTypeFromExtension(path) {
    const ext = path.toLowerCase().match(/\.([^.]+)$/)?.[1];

    const mimeTypes = {
        // JavaScript & TypeScript
        'js': 'application/javascript',
        'mjs': 'application/javascript',
        'cjs': 'application/javascript',
        'ts': 'application/typescript',
        'tsx': 'application/typescript',
        'jsx': 'text/jsx',

        // Стили
        'css': 'text/css',
        'scss': 'text/x-scss',
        'sass': 'text/x-sass',
        'less': 'text/x-less',

        // Разметка
        'html': 'text/html',
        'htm': 'text/html',
        'xml': 'application/xml',
        'svg': 'image/svg+xml',

        // Данные
        'json': 'application/json',
        'yaml': 'text/yaml',
        'yml': 'text/yaml',
        'toml': 'text/toml',
        'csv': 'text/csv',

        // Документы
        'md': 'text/markdown',
        'txt': 'text/plain',
        'pdf': 'application/pdf',

        // Изображения
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'ico': 'image/x-icon',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',

        // Шрифты
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'otf': 'font/otf',
        'eot': 'application/vnd.ms-fontobject',

        // Видео
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',

        // Аудио
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'm4a': 'audio/mp4',

        // Архивы
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        '7z': 'application/x-7z-compressed',

        // Бинарные
        'wasm': 'application/wasm',
        'exe': 'application/octet-stream',
        'dll': 'application/octet-stream',
    };

    return mimeTypes[ext] || 'application/octet-stream';
}

// Функция для определения, является ли тип текстовым (требует charset)
export function isTextContentType(mimeType) {
    const textTypes = new Set([
        'application/javascript',
        'application/typescript',
        'application/json',
        'application/xml',
        'text/jsx',
    ]);

    return mimeType.startsWith('text/') || textTypes.has(mimeType);
}