// Построение URL для GitHub raw content API
export function buildGitHubRawUrl(owner, repo, branch, filePath) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

// Парсинг пути для извлечения информации о репозитории
// Пока возвращает дефолтные значения, но готово к расширению
export function parseFilePath(filePath, defaultOwner = 'unel', defaultRepo = 'git-proxy', defaultBranch = 'main') {
    // TODO: В будущем можно парсить путь вида owner/repo/branch/filepath
    return {
        owner: defaultOwner,
        repo: defaultRepo,
        branch: defaultBranch,
        filePath: filePath
    };
}