# Модуль обработки ошибок

Модуль `errors.js` предоставляет структурированную систему обработки ошибок с правильными HTTP статус-кодами.

## Основные возможности

- Типизированные ошибки с предопределёнными статус-кодами
- JSON-формат ответов с `errorCode` для удобной обработки на клиенте
- Автоматическое определение типа ошибки от GitHub API
- CORS-заголовки во всех ответах с ошибками

## Примеры использования

### Базовый пример

```javascript
import { createErrorResponse, ErrorType } from '../utils/errors.js';

// Простая ошибка "файл не найден"
return createErrorResponse(ErrorType.FILE_NOT_FOUND);
```

**Ответ:**
```json
{
  "error": "Файл не найден в репозитории",
  "errorCode": "FILE_NOT_FOUND"
}
```
**HTTP статус:** `404`

### С дополнительными деталями

```javascript
const details = `${owner}/${repo}/${branch}/${filePath}`;
return createErrorResponse(ErrorType.FILE_NOT_FOUND, details);
```

**Ответ:**
```json
{
  "error": "Файл не найден в репозитории",
  "errorCode": "FILE_NOT_FOUND",
  "details": "unel/git-proxy/main/README.md"
}
```

### Обработка ошибок от GitHub API

```javascript
import { getErrorTypeFromGitHubResponse, createErrorResponse } from '../utils/errors.js';

const githubResponse = await fetch(githubRawUrl);

if (!githubResponse.ok) {
    const errorType = getErrorTypeFromGitHubResponse(githubResponse);
    return createErrorResponse(errorType, `Failed to fetch from GitHub`);
}
```

## Типы ошибок

| ErrorType | HTTP статус | errorCode | Описание |
|-----------|-------------|-----------|----------|
| `FILE_NOT_FOUND` | 404 | `FILE_NOT_FOUND` | Файл не найден в репозитории |
| `GITHUB_API_ERROR` | 502 | `GITHUB_API_ERROR` | Ошибка GitHub API |
| `RATE_LIMIT` | 429 | `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов к GitHub API |
| `FORBIDDEN` | 403 | `ACCESS_FORBIDDEN` | Доступ запрещён |
| `BAD_REQUEST` | 400 | `BAD_REQUEST` | Некорректные параметры запроса |
| `INTERNAL_ERROR` | 500 | `INTERNAL_ERROR` | Внутренняя ошибка сервера |
| `TEAPOT` | 418 | `TEAPOT` | Short and stout |
| `CENSORED` | 451 | `CENSORED` | [ДАННЫЕ УДАЛЕНЫ] |

## HTTP статус-коды

Все HTTP статус-коды доступны через объект `HttpStatus`:

```javascript
import { HttpStatus } from '../utils/errors.js';

console.log(HttpStatus.NOT_FOUND);        // 404
console.log(HttpStatus.BAD_GATEWAY);      // 502
console.log(HttpStatus.TOO_MANY_REQUESTS); // 429
```

## Обработка на клиенте

Пример обработки ошибок на клиенте:

```javascript
const response = await fetch('https://your-worker.dev/files/README.md');

if (!response.ok) {
    const error = await response.json();

    switch (error.errorCode) {
        case 'FILE_NOT_FOUND':
            console.log('Файл не найден:', error.details);
            break;
        case 'RATE_LIMIT_EXCEEDED':
            console.log('Превышен лимит, подождите немного');
            break;
        case 'GITHUB_API_ERROR':
            console.log('GitHub временно недоступен');
            break;
        default:
            console.log('Неизвестная ошибка:', error.error);
    }
}
```

## Кастомные статус-коды

Можно переопределить статус-код при необходимости:

```javascript
// Вернуть ошибку с кастомным статусом 503 вместо дефолтного
return createErrorResponse(ErrorType.GITHUB_API_ERROR, 'Maintenance', 503);
```
