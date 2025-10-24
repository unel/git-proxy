# Git-Proxy

Прокси-сервер на базе Cloudflare Workers для раздачи raw-файлов из GitHub репозиториев с поддержкой CORS.

## Описание

Git-Proxy — это легковесный serverless-прокси, который позволяет раздавать файлы из GitHub репозиториев через кастомный endpoint. Автоматически определяет content-type, обрабатывает кодировку и добавляет CORS-заголовки, что упрощает загрузку файлов из GitHub в веб-приложениях.

## Возможности

- **Гибкая маршрутизация**: URLPattern для работы с любыми репозиториями или дефолтным
- **Версионирование**: Query параметр `?ref=` для получения файлов из конкретной ветки, коммита или тега
- **Конфигурируемость**: Переменные окружения для настройки дефолтных owner/repo/branch
- **Прокси для GitHub Raw Files**: Раздает файлы из GitHub репозиториев через чистый API
- **Автоопределение Content-Type**: Поддержка JS, CSS, HTML, JSON, изображений и др.
- **CORS с Preflight**: Полная поддержка cross-origin запросов, включая OPTIONS preflight
- **UTF-8 кодировка**: Корректная обработка текстового контента
- **Бинарные файлы**: Поддержка изображений и других бинарных форматов
- **Edge кэширование**: Cloudflare Cache API для минимальной задержки и снижения нагрузки на GitHub
- **Метаданные**: Поддержка ETag, Last-Modified, Content-Length для эффективного кэширования
- **Edge сеть**: Развернут в глобальной CDN Cloudflare для низкой задержки
- **HTML-заглушка**: Приветственная страница с документацией API для корневого пути

## Использование

### API Endpoints

Поддерживаются три варианта URL для гибкой работы с репозиториями:

```
GET /files/o/:owner/r/:repo/:path     # Явно указать owner и repo
GET /files/r/:repo/:path               # Использовать дефолтный owner (unel)
GET /files/:path                       # Использовать дефолтные owner/repo (unel/git-proxy)
```

#### Query параметры

- **`?ref=<branch|commit|tag>`** - Указать конкретную версию файла (ветку, коммит или тег)
  - По умолчанию используется `DEFAULT_BRANCH` (main)
  - Примеры: `?ref=develop`, `?ref=abc123def`, `?ref=v1.0.0`

### Примеры

Запрос файлов из разных репозиториев:

```bash
# Файл из конкретного репозитория
curl https://your-worker.workers.dev/files/o/facebook/r/react/README.md

# Файл из репозитория текущего owner
curl https://your-worker.workers.dev/files/r/another-repo/config.json

# Файл из дефолтного репозитория (unel/git-proxy)
curl https://your-worker.workers.dev/files/worker.js

# Вложенные пути работают везде
curl https://your-worker.workers.dev/files/o/torvalds/r/linux/arch/x86/kernel/cpu/intel.c

# Получить файл из другой ветки
curl https://your-worker.workers.dev/files/README.md?ref=develop

# Получить файл из конкретного коммита
curl https://your-worker.workers.dev/files/worker.js?ref=abc123def456

# Получить файл из тега (релиза)
curl https://your-worker.workers.dev/files/o/facebook/r/react/package.json?ref=v18.0.0
```

### В браузере

```javascript
// Загрузить файл из конкретного репозитория
fetch('https://your-worker.workers.dev/files/o/facebook/r/react/package.json')
  .then(response => response.json())
  .then(data => console.log(data));

// Загрузить файл из дефолтного репозитория
fetch('https://your-worker.workers.dev/files/utils/mime.js')
  .then(response => response.text())
  .then(code => console.log(code));

// Загрузить файл из конкретной ветки
fetch('https://your-worker.workers.dev/files/worker.js?ref=develop')
  .then(response => response.text())
  .then(code => console.log(code));

// Загрузить файл из конкретного коммита (иммутабельно)
fetch('https://your-worker.workers.dev/files/README.md?ref=abc123def')
  .then(response => response.text())
  .then(content => console.log(content));

// Загрузить изображение
const img = document.createElement('img');
img.src = 'https://your-worker.workers.dev/files/o/github/r/explore/blob/main/topics/javascript/javascript.png';
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
    },
    "vars": {
        "DEFAULT_OWNER": "unel",
        "DEFAULT_REPO": "git-proxy",
        "DEFAULT_BRANCH": "main"
    }
}
```

### Переменные окружения

Проект поддерживает настройку через переменные окружения:

- **`DEFAULT_OWNER`** - GitHub owner по умолчанию (например, `unel`)
- **`DEFAULT_REPO`** - Репозиторий по умолчанию (например, `git-proxy`)
- **`DEFAULT_BRANCH`** - Ветка по умолчанию (например, `main`)

Эти значения используются когда в URL не указаны явные параметры owner/repo. Настраиваются в секции `vars` файла `wrangler.jsonc`.

## Структура проекта

```
git-proxy/
├── handlers/
│   ├── fileHandler.js      # Обработчик запросов на получение файлов
│   ├── faviconHandler.js   # Обработчик фавиконки
│   ├── indexHandler.js     # Обработчик главной страницы
│   └── preflightHandler.js # Обработчик CORS preflight (OPTIONS)
├── utils/
│   ├── mime.js             # Определение MIME-типов и работа с content-type
│   ├── github.js           # Построение URL для GitHub Raw API
│   ├── headers.js          # Формирование HTTP заголовков (CORS, Content-Type)
│   ├── errors.js           # Структурированная обработка ошибок
│   └── router.js           # Система роутинга с URLPattern
├── public/
│   ├── index.html          # Приветственная страница с документацией API (шаблон)
│   ├── favicon.svg         # SVG фавиконка
│   └── favicon.js          # Модуль с экспортом SVG фавиконки
├── routes.js               # Конфигурация маршрутов приложения
├── worker.js               # Главный обработчик запросов
├── wrangler.jsonc          # Конфигурация Cloudflare Workers
├── .gitignore              # Игнорируемые файлы (кэш, логи)
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

1. **Роутинг запросов** (URLPattern):
   - OPTIONS запросы → CORS preflight обработчик
   - GET `/files/o/:owner/r/:repo/:path` → парсинг параметров и обработчик файлов
   - GET `/files/r/:repo/:path` → дефолтный owner + обработчик файлов
   - GET `/files/:path` → дефолтные owner/repo + обработчик файлов
   - Остальное → HTML-заглушка с документацией
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

Проект построен на модульной архитектуре с централизованным роутингом:

```
Запрос клиента
    ↓
OPTIONS? → CORS Preflight Handler → 204 No Content
    ↓
Router (routes.js) - проверка URLPattern по приоритету:
  ├─ /favicon.ico                  → Редирект на /favicon.svg (301)
  ├─ /favicon.svg                  → Фавиконка (SVG)
  ├─ /files/o/:owner/r/:repo/:path → File Handler (явный owner/repo)
  ├─ /files/r/:repo/:path          → File Handler (дефолтный owner)
  ├─ /files/:path                  → File Handler (дефолтные owner/repo)
  └─ другое                        → Index Handler (HTML-заглушка)
    ↓
File Handler:
  ├─ Cache Check (Cloudflare Cache API)
  ├─ Cache Hit? → Ответ из кэша
  └─ Cache Miss:
      ├─ GitHub Raw API (raw.githubusercontent.com)
      ├─ Определение Content-Type
      ├─ Обработка кодировки
      ├─ Формирование заголовков (CORS, Metadata, Cache-Control)
      ├─ Сохранение в кэш (ctx.waitUntil)
      └─ Ответ клиенту
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