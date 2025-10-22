export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url)

        // Проксировать только запросы по нужному пути, например /files/
        if (!url.pathname.startsWith('/files/')) {
            return new Response('Not Found', { status: 404 })
        }

        // Вырезаем путь к файлу после /files/
        const filePath = url.pathname.replace('/files/', '')

        // Формируем URL raw файла в GitHub (пример одного репо)
        // Можно логикой определять разные репозитории по первому сегменту filePath
        const githubRawUrl = `https://raw.githubusercontent.com/unel/git-proxy/main/${filePath}`

        // Запрашиваем файл из GitHub
        const githubResponse = await fetch(githubRawUrl)

        if (!githubResponse.ok) {
            return new Response('File Not Found', { status: 404 })
        }

        // Функция определения Content-Type по расширению файла
        function getContentType(path) {
            if (path.endsWith('.js')) return 'application/javascript'
            if (path.endsWith('.css')) return 'text/css'
            if (path.endsWith('.html')) return 'text/html'
            if (path.endsWith('.json')) return 'application/json'
            if (path.endsWith('.png')) return 'image/png'
            if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
            if (path.endsWith('.svg')) return 'image/svg+xml'
            return 'application/octet-stream'
        }

        // Определяем Content-Type
        const contentType = getContentType(filePath)
        const isTextContent = (contentType.startsWith('text') || contentType.includes('json') || contentType.includes('javascript'))
        // Если это текстовый тип — декодируем как UTF-8
        let body
        if (isTextContent) {
            const text = await githubResponse.text()
            body = new TextEncoder().encode(text)
        } else {
            body = await githubResponse.arrayBuffer()
        }

        // Формируем и возвращаем ответ с нужными заголовками CORS и Content-Type
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': contentType + '; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        })
    }
}