# 🔍 JS Documentation

*This document describes three JavaScript utilities: two for validating remote JSON files and one for structured browser logging during development. These sources are designed to help you ensure data integrity, format consistency, and readable debugging before consuming content in your frontend or services.*

---

## 1. validateJSON.js

📝 **Description:**  
Validates any remote JSON file. Checks if the JSON is an array or object, optionally verifies it is not empty, and can enforce required keys in each object (if the JSON is an array).

### 🔑 Query Parameters

| Parameter      | Type   | Required | Description                                                    |
|----------------|--------|----------|----------------------------------------------------------------|
| `url`          | string | Yes      | The remote JSON URL to validate                                |
| `timeout`      | number | No       | Timeout in milliseconds before aborting the request (default: 7000) |
| `requiredKeys` | string | No       | Comma-separated list of keys that each object must contain (only if JSON is array) |
| `requireContent`| string | No       | Set to `'false'` to allow empty arrays or objects (default: true) |
| `debug`        | string | No       | Set to `'false'` to silence server logs (default: true)       |

### 📦 Response

- Success:

```json
{
  "valid": true,
  "data": { /* Parsed JSON object or array */ }
}
```

- Failure:

```json
{
  "valid": false,
  "error": "Descriptive error message"
}
```

### 🛠️ Usage Example

1. IMPORT DIRECTLY FROM REPOSITORY — no need to download:

```js
import { validateJSON } from "https://open-utils-dev-sandokan-cat.vercel.app/js/validateJSON.js";
```

or

```html
<script  type="module" src="https://open-utils-dev-sandokan-cat.vercel.app/js/validateJSON.js"></script>
```

2. OR DOWNLOAD AND IMPORT FROM YOUR OWN PROJECT FOLDER:

```js
import { validateJSON } from "./js/validateJSON.js";
```

or

```html
<script type="module" src="js/validateJSON.js"></script>
```

---

## 2. validateCarousel.js

📝 **Description:**
Validates a JSON file structured for responsive image carousels. Checks that each entry contains exactly the keys webp, png, and alt, verifies valid image paths and extensions, presence of resolution multipliers (1x, 2x, 3x), fallback image validity, and ensures no duplicate image paths across entries.

### 🔑 Query Parameters

| Parameter | Type   | Required | Description                                             |
| --------- | ------ | -------- | ------------------------------------------------------- |
| `url`     | string | Yes      | Remote JSON URL containing carousel images              |
| `debug`   | string | No       | Set to `'false'` to silence server logs (default: true) |

### 📦 Response

- Success:

```json
{
  "valid": true,
  "data": [ /* Array of validated image objects */ ]
}
```

- Failure:

```json
{
  "valid": false,
  "error": "Descriptive error message"
}
```

### 🧩 Key Validations

- JSON must be an array with at least 2 image entries.
- Each entry must have exactly 3 keys: webp, png, and alt.
- webp must have only the key srcSet with valid image paths including 1x, 2x, and 3x multipliers.
- png must have srcSet and fallback keys, where fallback must be part of the srcSet.
- alt must be a string longer than 5 characters.
- No duplicate image paths are allowed across different entries, except the fallback image if it is included in the same entry’s srcSet.

### 🛠️ Usage Example

1. IMPORT DIRECTLY FROM REPOSITORY — no need to download:

```js
import { validateCarousel } from "https://open-utils-dev-sandokan-cat.vercel.app/js/validateCarousel.js";
```

or

```html
<script type="module" src="https://open-utils-dev-sandokan-cat.vercel.app/js/validateCarousel.js"></script>
```

2. OR DOWNLOAD AND IMPORT FROM YOUR OWN PROJECT FOLDER:

```js
import { validateCarousel } from "./js/validateCarousel.js";
```

or

```html
<script type="module" src="js/validateCarousel.js"></script>
```

### ❗ Common Errors

- Missing 'url' parameter — The required url query parameter is missing.
- JSON MUST BE ARRAY OR OBJECT — The remote JSON is neither an array nor an object.
- MISSING REQUIRED KEYS — Required keys are missing in one or more objects.
- INVALID TYPE — The fetched resource is not JSON.
- DUPLICATE PATH DETECTED — Duplicate image paths found across carousel entries.
- AT LEAST 2 VALID IMAGES REQUIRED — Carousel JSON must contain at least two images.

---

## ⚠️ Notes

- Both sources are designed for easy integration from any frontend.
- Use `debug=false` in production to avoid excessive server logging.
- Always validate your JSON with these sources before using it to prevent runtime errors and improve data integrity.

> *Feel free to extend this documentation with curl examples or integration guides if needed.*

---

## 3. logger.js

**📝 Description:**
Simple but powerful development logger with log level filtering, environment checks, emoji tagging, and optional grouping. Designed for consistent and readable debugging in browser environments.

---

### 🎛️ Features

- Auto-disables in production (!isDev) or if log:silent cookie is set
- Emoji for each log type: ❌ error, ⚠️ warn, ℹ️ info, 🛠️ debug, 📋 log, 🔎 trace, 🚨 assert, etc.
- Supports grouped logs (normal or collapsed)
- Validates log levels and groups unknown ones for visibility
- Minimal syntax: just import and use

---

### 🚀 Exported Functions

| Function                  | Description                                 |
|---------------------------|---------------------------------------------|
| `logger.enable()`         | Enables logging explicitly via cookie       |
| `logger.disable()`        | Silences all logs regardless of environment |
| `logger.clear()`          | Clears the console if enabled               |
| `logger.error()`          | ❌ Logs errors                              |
| `logger.warn()`           | ⚠️ Logs warnings                            |
| `logger.info()`           | ℹ️ Informational logs                       |
| `logger.debug()`          | 🛠️ Debug logs                               |
| `logger.normal()`         | 📋 Standard logs (`console.log`)            |
| `logger.trace()`          | 🔎 Stack traces                             |
| `logger.assert()`         | 🚨 Conditional assertions                   |
| `logger.dir()`            | 📂 Object structures                        |
| `logger.table()`          | 📊 Tabular data                             |
| `logger.count()`          | 🔢 Increments a named counter               |
| `logger.countReset()`     | 🔄 Resets a named counter                   |
| `logger.time()`           | ⏱️ Starts a timer                           |
| `logger.timeEnd()`        | 💥 Ends and logs timer duration             |
| `logger.timeLog()`        | ⌛ Logs intermediate timer value            |
| `logger.group()`          | 📦 Expanded log group (expanded)            |
| `logger.groupCollapse()`  | 👉 Collapsed log group                      |

---

### 🛠️ Usage Example

1. IMPORT DIRECTLY FROM REPOSITORY — no need to download:

```js
import logger from "https://open-utils-dev-sandokan-cat.vercel.app/js/logger.js";
```

or

```html
<script  type="module" src="https://open-utils-dev-sandokan-cat.vercel.app/js/logger.js"></script>
```

2. OR DOWNLOAD AND IMPORT FROM YOUR OWN PROJECT FOLDER:

```js
import logger from "./js/logger.js";
```

or

```html
<script type="module" src="js/logger.js"></script>
```

3. SAMPLE LOGS:

```js
logger.info('Logger started');
logger.error('An error occurred', { code: 500 });
logger.group('User Actions', () => {
    logger.debug('Clicked button A');
    logger.debug('Opened modal');
});
```

---

### ⚠️ Notes

- These source are designed for easy integration from any frontend.
- Use `isSilent` cookie in production to avoid excessive logging.

> *Feel free to extend this documentation with curl examples or integration guides if needed.*

