// Сжатие данных с использованием CompressionStream API
// Поддерживает gzip, deflate, и deflate-raw (brotli пока не поддерживается везде)

// Минимальный размер для сжатия (1KB)
const MIN_COMPRESS_SIZE = 1024;

// Поддерживаемые алгоритмы компрессии в порядке предпочтения
const COMPRESSION_ALGORITHMS = ['gzip', 'deflate'];

/**
 * Определяет лучший алгоритм компрессии на основе Accept-Encoding заголовка
 * @param {string} acceptEncoding - Значение заголовка Accept-Encoding
 * @returns {string|null} - Название алгоритма или null
 */
export function getBestCompressionAlgorithm(acceptEncoding) {
    if (!acceptEncoding) {
        return null;
    }

    const accepted = acceptEncoding.toLowerCase();

    // Проверяем поддерживаемые алгоритмы в порядке предпочтения
    for (const algo of COMPRESSION_ALGORITHMS) {
        if (accepted.includes(algo)) {
            return algo;
        }
    }

    return null;
}

/**
 * Проверяет, нужно ли сжимать контент
 * @param {string} contentType - MIME-тип контента
 * @param {number} contentLength - Размер контента в байтах
 * @param {boolean} isText - Является ли контент текстовым
 * @returns {boolean}
 */
export function shouldCompress(contentType, contentLength, isText) {
    // Сжимаем только текстовые файлы размером больше MIN_COMPRESS_SIZE
    return isText && contentLength >= MIN_COMPRESS_SIZE;
}

/**
 * Сжимает ArrayBuffer используя указанный алгоритм
 * @param {ArrayBuffer} data - Данные для сжатия
 * @param {string} algorithm - Алгоритм сжатия ('gzip' или 'deflate')
 * @returns {Promise<ArrayBuffer>} - Сжатые данные
 */
export async function compressData(data, algorithm) {
    // Создаём ReadableStream из ArrayBuffer
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array(data));
            controller.close();
        }
    });

    // Применяем компрессию
    const compressedStream = stream.pipeThrough(
        new CompressionStream(algorithm)
    );

    // Читаем все чанки и собираем в один ArrayBuffer
    const chunks = [];
    const reader = compressedStream.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    // Объединяем все чанки в один ArrayBuffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result.buffer;
}

/**
 * Пытается сжать данные если это возможно и выгодно
 * @param {ArrayBuffer} data - Данные для сжатия
 * @param {string} acceptEncoding - Accept-Encoding заголовок из запроса
 * @param {string} contentType - MIME-тип контента
 * @param {boolean} isText - Является ли контент текстовым
 * @returns {Promise<{body: ArrayBuffer, encoding: string|null}>}
 */
export async function tryCompress(data, acceptEncoding, contentType, isText) {
    // Проверяем, нужно ли сжимать
    if (!shouldCompress(contentType, data.byteLength, isText)) {
        return { body: data, encoding: null };
    }

    // Определяем алгоритм сжатия
    const algorithm = getBestCompressionAlgorithm(acceptEncoding);
    if (!algorithm) {
        return { body: data, encoding: null };
    }

    try {
        // Сжимаем данные
        const compressed = await compressData(data, algorithm);

        // Возвращаем сжатые данные только если они действительно меньше
        if (compressed.byteLength < data.byteLength) {
            return { body: compressed, encoding: algorithm };
        }

        // Если сжатие не уменьшило размер, возвращаем оригинал
        return { body: data, encoding: null };
    } catch (error) {
        // В случае ошибки сжатия, возвращаем оригинальные данные
        console.error('Compression failed:', error);
        return { body: data, encoding: null };
    }
}
