// Построение URL для GitHub raw content API
export function buildGitHubRawUrl(owner, repo, branch, filePath) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

// Определение типа ref (commit SHA, semver tag, или branch)
export function detectRefType(ref) {
    if (!ref) {
        return 'branch'; // дефолтная ветка
    }

    // Проверяем на commit SHA (40 hex символов или короткий SHA 7-40 символов)
    if (/^[0-9a-f]{7,40}$/i.test(ref)) {
        return 'commit';
    }

    // Проверяем на semver tag (v1.0.0, 1.0.0, v1.0.0-beta, etc)
    if (/^v?\d+\.\d+\.\d+/.test(ref)) {
        return 'tag';
    }

    // Всё остальное считаем веткой
    return 'branch';
}

// Генерация Cache-Control заголовка в зависимости от типа ref
export function getCacheControlForRef(ref) {
    const refType = detectRefType(ref);

    switch (refType) {
        case 'commit':
            // Коммиты иммутабельны - кэшируем максимально долго (1 год)
            return 'public, max-age=31536000, s-maxage=31536000, immutable';

        case 'tag':
            // Теги обычно не меняются, но могут быть удалены/пересозданы
            // Кэшируем на 1 неделю
            return 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400';

        case 'branch':
        default:
            // Ветки изменяются часто - короткий TTL (5 минут)
            // stale-while-revalidate для graceful обновления
            return 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600';
    }
}

// Парсинг пути и параметров репозитория с дефолтными значениями
// Поддерживает указание ref (branch/commit/tag) через параметр
// Дефолтные значения должны передаваться из переменных окружения
export function parseFilePath(
    path,
    owner,
    repo,
    defaultBranch,
    ref = null
) {
    // Если путь не указан, возвращаем дефолты
    if (!path) {
        return {
            owner,
            repo,
            branch: ref || defaultBranch,
            filePath: ''
        };
    }

    // Используем ref из параметра, если указан, иначе дефолтную ветку
    return {
        owner,
        repo,
        branch: ref || defaultBranch,
        filePath: path
    };
}