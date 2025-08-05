/*!
 * @fileoverview validateJSON.js – FETCHES AND VALIDATES JSON FILES FROM URL
 *
 * @author © 2025 sandokan.cat – https://sandokan.cat
 * @license MIT – https://opensource.org/licenses/MIT
 * @version 1.0.0
 * @since 1.0.0
 * @date 2025-07-28
 * @see https://open-utils-dev-sandokan-cat.vercel.app/js/README.md
 *
 * @description
 * Downloads and validates remote JSON files, ensuring they conform to expected structural rules.
 * Accepts both arrays and objects, with optional constraints like required keys, entry types, and non-empty content.
 * Designed to fail fast on invalid or redirected responses. Configurable via a flexible options object.
 * 
 * @module validateJSON
 * @exports validateJSON
 *
 * @async
 * @function validateJSON
 *
 * @typedef {Object} ValidateJSONOptions
 * @property {number} [timeout=7000]                     - Timeout in ms for the fetch request
 * @property {boolean} [requireContent=true]             - Whether to reject if structure is empty
 * @property {string} [allowedTypes="object"]            - Allowed types for array entries
 * @property {string[]} [requiredKeys=["id", "name"]]    - Keys that must exist in each array entry (if applicable)
 *
 * @param {string} url                                   - Absolute or relative path to the JSON file
 * @param {ValidateJSONOptions} [options={}]             - Optional validation rules
 *
 * @returns {Promise<Object|Object[]>} Resolves with validated JSON content (object or array)
 *
 * @throws {TypeError} If arguments are of invalid types
 * @throws {Error} If the fetched data has invalid structure or content
 * @throws {Error} If the response is redirected or has an invalid content type
 * @throws {FetchError} If the file fails to load or times out
 *
 * @example
 * // Basic usage with default validation
 * const json = await validateJSON("data/example.json");
 *
 * @example
 * // With custom validation rules
 * const data = await validateJSON("data/example.json", {
 *   timeout: 5000,
 *   requireContent: true,
 *   allowedTypes: "object,string",
 *   requiredKeys: ["id", "title"]
 * });
 *
 * @internal Used by: validateCarousel(), and other JSON-consuming modules
 *
 * @todo Accept nested keys with dot-notation (e.g. "meta.author")
 * @todo Add fallback option for retrying from alternative URLs
 * @todo Emit structured error objects with codes and hints
 */

// VALIDATE AND PARSE A JSON FILE FROM URL
export async function validateJSON(url, options = {}) {
        const controller = new AbortController(); // CREATE ABORT CONTROLLER FOR TIMEOUT
        const timeout = setTimeout(() => controller.abort(), options.timeout || 7000); // DEFAULT TIMEOUT 7s

    try {
        const res = await fetch(url, {
            ...options, // SPREAD USER OPTIONS
            signal: controller.signal, // ATTACH ABORT SIGNAL
        });

        // CHECK STATUS
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        // CHECK CONTENT-TYPE (TOLERANT TO ANY TYPE CONTAINING "json")
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.toLowerCase().includes("json"))
            throw new Error(`INVALID TYPE: ${contentType}`);

        // CHECK REDIRECT
        if (res.redirected)
            throw new Error(`REDIRECTED TO: ${res.url}`);

        const data = await res.json(); // PARSE DATA

        // VALID ROOT: MUST BE ARRAY OR OBJECT
        const isArray = Array.isArray(data);
        const isObject = typeof data==="object" && data!==null;
        if (!isArray && !isObject)
            throw new Error(`${url} → JSON MUST BE ARRAY OR OBJECT`);

        // CHECK ARRAY ENTRIES TYPE (DEFAULT: OBJECTS)
        if (isArray) {
            const allowed = (options.allowedTypes || 'object').split(','); // EX: "object,string"
            const allValid = data.every(entry =>
                allowed.includes(typeof entry) && entry !== null
            );
            if (!allValid)
                throw new Error(`ARRAY CONTAINS INVALID ENTRIES (ALLOWED: ${allowed.join(", ")})`);
        }

        // CHECK IF EMPTY STRUCTURE
        const requireContent = options.requireContent!==false; // FAIL IF EMPTY ARRAY OR OBJECT (default TRUE)
        if (requireContent) {
            if (isArray && !data.length)
                throw new Error(`${url} → EMPTY ARRAY`);
            if (isObject && !Object.keys(data).length)
                throw new Error(`${url} → EMPTY OBJECT`);
        }

        // CHECK REQUIRED KEYS INSIDE ARRAY OBJECTS
        const requiredKeys = options.requiredKeys || null; // MANDATORY KEYS PER OBJECT (only for arrays)
        if (requiredKeys && isArray) {
            const allValid = data.every(obj =>
                requiredKeys.every(key => Object.prototype.hasOwnProperty.call(obj, key))
            );
            if (!allValid)
                throw new Error(`${url} → MISSING REQUIRED KEYS: ${requiredKeys.join(", ")}`);
        }

        return data; // RETURN VALIDATED DATA

    } catch (err) {
        console.error("validateJSON.js ERROR", url, "→", err.name, err.message, err.stack); // LOG ERROR FOR DEBUGGING
        
        throw err; // RE-THROW FOR EXTERNAL HANDLING
    } finally {
        clearTimeout(timeout); // CLEAR TIMEOUT ON SUCCESS
    }
}