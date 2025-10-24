// Построение URL для GitHub raw content API
export function buildGitHubRawUrl(owner, repo, branch, filePath) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

// Парсинг пути и параметров репозитория с дефолтными значениями
// Путь может быть в формате: branch/path/to/file или просто path/to/file
// Дефолтные значения должны передаваться из переменных окружения
export function parseFilePath(
    path,
    owner,
    repo,
    defaultBranch
) {
    // Если путь не указан, возвращаем дефолты
    if (!path) {
        return {
            owner,
            repo,
            branch: defaultBranch,
            filePath: ''
        };
    }

    // TODO: В будущем можно добавить логику определения branch из пути
    // Например, если первый сегмент совпадает с известными ветками

    return {
        owner,
        repo,
        branch: defaultBranch,
        filePath: path
    };
}