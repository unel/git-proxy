# Git-Proxy

Прокси-сервер на базе Cloudflare Workers для раздачи raw-файлов из GitHub репозиториев с поддержкой CORS.

## Описание

Git-Proxy — это легковесный serverless-прокси, который позволяет раздавать файлы из GitHub репозиториев через кастомный endpoint. Автоматически определяет content-type, обрабатывает кодировку и добавляет CORS-заголовки, что упрощает загрузку файлов из GitHub в веб-приложениях.

## Возможности

- **Прокси для GitHub Raw Files**: Раздает файлы из GitHub репозиториев через чистый API
- **Автоопределение Content-Type**: Поддержка JS, CSS, HTML, JSON, изображений и др.
- **CORS с Preflight**: Полная поддержка cross-origin запросов, включая OPTIONS preflight
- **UTF-8 кодировка**: Корректная обработка текстового контента
- **Бинарные файлы**: Поддержка изображений и других бинарных форматов
- **Edge кэширование**: Cloudflare Cache API для минимальной задержки и снижения нагрузки на GitHub
- **Метаданные**: Поддержка ETag, Last-Modified, Content-Length для эффективного кэширования
- **Edge сеть**: Развернут в глобальной CDN Cloudflare для низкой задержки

## Использование

### API Endpoint

```
GET /files/{filepath}
```

### Примеры

Запрос файла из репозитория:

```bash
# Получить JavaScript файл
curl https://your-worker.workers.dev/files/example.js

# Получить CSS файл
curl https://your-worker.workers.dev/files/styles/main.css

# Получить изображение
curl https://your-worker.workers.dev/files/images/logo.png
```

### В браузере

```javascript
// Загрузить JavaScript файл
fetch('https://your-worker.workers.dev/files/script.js')
  .then(response => response.text())
  .then(code => console.log(code));

// Загрузить изображение
const img = document.createElement('img');
img.src = 'https://your-worker.workers.dev/files/images/photo.jpg';
```

## Поддерживаемые типы файлов

Проект поддерживает 50+ типов файлов с автоматическим определением MIME-типа:

- **JavaScript/TypeScript**: `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`
- **Стили**: `.css`, `.scss`, `.sass`, `.less`
- **Разметка**: `.html`, `.htm`, `.xml`, `.svg`
- **Данные**: `.json`, `.yaml`, `.yml`, `.toml`, `.csv`
- **Документы**: `.md`, `.txt`, `.pdf`
- **Изображения**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.ico`, `.bmp`, `.tiff`
- **Шрифты**: `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`
- **Медиа**: `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.m4a`
- **Архивы**: `.zip`, `.tar`, `.gz`, `.7z`
- **Бинарные**: `.wasm`, `.exe`, `.dll`

Полный список см. в [utils/mime.js](utils/mime.js).

## Конфигурация

Прокси настраивается через [wrangler.jsonc](wrangler.jsonc):

```jsonc
{
    "name": "broad-water-3597",
    "compatibility_date": "2025-10-22",
    "main": "./worker.js",
    "observability": {
        "enabled": true,
        "head_sampling_rate": 1
    }
}
```

### Текущий репозиторий

Сейчас захардкожен для раздачи из репозитория `unel/git-proxy`, ветка `main`. Для изменения см. [utils/github.js](utils/github.js).

## Структура проекта

```
git-proxy/
├── handlers/
│   ├── fileHandler.js      # Обработчик запросов на получение файлов
│   └── preflightHandler.js # Обработчик CORS preflight (OPTIONS)
├── utils/
│   ├── mime.js             # Определение MIME-типов и работа с content-type
│   ├── github.js           # Построение URL для GitHub Raw API
│   └── headers.js          # Формирование HTTP заголовков (CORS, Content-Type)
├── worker.js               # Главный обработчик запросов (роутинг)
├── wrangler.jsonc          # Конфигурация Cloudflare Workers
├── README.md               # Документация
└── TODO.md                 # Планируемые улучшения
```

## Деплой

### Требования

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Аккаунт Cloudflare

### Развертывание на Cloudflare Workers

```bash
# Установить wrangler, если еще не установлен
npm install -g wrangler

# Авторизоваться в Cloudflare
wrangler login

# Задеплоить worker
wrangler deploy
```

## Разработка

### Локальная разработка

```bash
# Запустить локальный dev-сервер
wrangler dev

# Протестировать локально
curl http://localhost:8787/files/README.md
```

## Как это работает

1. **Роутинг запросов**:
   - OPTIONS запросы → CORS preflight обработчик
   - GET `/files/{filepath}` → обработчик файлов
2. **Проверка кэша**: Сначала проверяет Cloudflare Cache API
3. **Формирование URL**: Строит URL для GitHub raw content API (при cache miss)
4. **Получение файла**: Запрашивает файл из GitHub
5. **Определение Content-Type**:
   - Приоритет: используется заголовок от GitHub
   - Fallback: определение по расширению файла
6. **Оптимизированная обработка**: Передача данных без лишних перекодировок
7. **Формирование заголовков**:
   - CORS заголовки
   - Content-Type с charset для текстовых файлов
   - Метаданные: ETag, Last-Modified, Content-Length
   - Cache-Control для управления кэшем
8. **Кэширование**: Сохранение в Cache API (асинхронно через `ctx.waitUntil()`)
9. **Ответ**: Возвращает файл клиенту

## Архитектура

```
Запрос клиента
    ↓
OPTIONS? → CORS Preflight Handler → 204 No Content
    ↓
/files/{filepath}
    ↓
Cache Check (Cloudflare Cache API)
    ↓
Cache Hit? → Ответ из кэша
    ↓ (Cache Miss)
GitHub Raw API
    ↓
Определение Content-Type
    ↓
Обработка кодировки
    ↓
Формирование заголовков (CORS, Metadata, Cache-Control)
    ↓
Сохранение в кэш (ctx.waitUntil)
    ↓
Ответ клиенту
```

## Кэширование

Проект использует **Cloudflare Cache API** для кэширования файлов на edge:

- **Cache-Control**: `public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
  - Файлы кэшируются на 1 час на клиенте и CDN
  - Stale-while-revalidate позволяет отдавать устаревший контент на 24 часа пока обновляется кэш
- **Metadata**: ETag и Last-Modified от GitHub для валидации кэша
- **Background caching**: Использование `ctx.waitUntil()` для сохранения в кэш без блокировки ответа

## CORS

Полная поддержка Cross-Origin Resource Sharing:

- **Preflight**: Обработка OPTIONS запросов
- **Заголовки**:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
  - `Access-Control-Max-Age: 86400` (кэширование preflight на 24 часа)

## Лицензия

ISC