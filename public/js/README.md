# 🔍 JS Documentation

*This document describes two JavaScript files to validate remote JSON files. These sources are designed to help you ensure the structure, content, and format of JSON data before consuming it in your frontend or services.*

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
import { validateJSON } from "https://open-utils-sandokancats-projects.vercel.app/js/validateJSON.js";
```
or
```html
<script  type="module" src="https://open-utils-sandokancats-projects.vercel.app/js/validateJSON.js"></script>
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
import { validateCarousel } from "https://open-utils-sandokancats-projects.vercel.app/js/validateCarousel.js";
```
or
```html
<script type="module" src="https://open-utils-sandokancats-projects.vercel.app/js/validateCarousel.js"></script>
```

2. OR DOWNLOAD AND IMPORT FROM YOUR OWN PROJECT FOLDER:
```js
import { validateCarousel } from "./js/validateCarousel.js";
```
or
```html
<script type="module" src="js/validateCarousel.js"></script>
```

###❗Common Errors

- Missing 'url' parameter — The required url query parameter is missing.
- JSON MUST BE ARRAY OR OBJECT — The remote JSON is neither an array nor an object.
- MISSING REQUIRED KEYS — Required keys are missing in one or more objects.
- INVALID TYPE — The fetched resource is not JSON.
- DUPLICATE PATH DETECTED — Duplicate image paths found across carousel entries.
- AT LEAST 2 VALID IMAGES REQUIRED — Carousel JSON must contain at least two images.

---

## ⚠️ Notes

- Both sources are designed for easy integration from any frontend.
- Use debug=false in production to avoid excessive server logging.
- Always validate your JSON with these sources before using it to prevent runtime errors and improve data integrity.

*Feel free to extend this documentation with curl examples or integration guides if needed.*
