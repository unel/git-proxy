/**
 * Обработчик для главной страницы с документацией
 */
export async function handleIndex(request, env) {
    const { default: indexHTML } = await import('../public/index.html');

    // Подставляем текущие значения переменных окружения
    const defaultOwner = env.DEFAULT_OWNER || 'unel';
    const defaultRepo = env.DEFAULT_REPO || 'git-proxy';
    const defaultBranch = env.DEFAULT_BRANCH || 'main';

    const processedHTML = indexHTML
        .replace(/\{\{DEFAULT_OWNER\}\}/g, defaultOwner)
        .replace(/\{\{DEFAULT_REPO\}\}/g, defaultRepo)
        .replace(/\{\{DEFAULT_BRANCH\}\}/g, defaultBranch);

    return new Response(processedHTML, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
