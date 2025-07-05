/*!
 * validateJSON.js – Fetches and validates JSON files
 *
 * © 2025 sandokan.cat – https://sandokancat.github.io/CV/
 *
 * Released under the MIT License.
 * See: https://opensource.org/licenses/MIT
 *
 * @version 1.4.0
 * @author sandokan.cat
 *
 * USAGE EXAMPLE:
 *
 * // Validate JSON from URL with options (can be edited to fit your needs):
 * const data = await validateJSON("data.json", {
 *   timeout: 5000,                // max time to wait for response in ms (default 7000)
 *   requireContent: true,         // fail if JSON array/object is empty (default true)
 *   requiredKeys: ["id", "name"], // ensure each object in array has at least one of these keys (only for arrays)
 *   debug: true                   // log detailed errors in console (default true)
 *   // You can also add fetch options like method, headers, etc.
 * });
 *
 * // data will be either an array of objects or an object of objects,
 * // ready to use in your app with confidence that structure is valid.
 */

// VALIDATE AND PARSE A JSON FILE FROM URL
export async function validateJSON(url, options = {}) {
    try {
        const controller = new AbortController(); // CREATE ABORT CONTROLLER FOR TIMEOUT
        const timeout = setTimeout(() => controller.abort(), options.timeout || 7000); // DEFAULT TIMEOUT 7s

        const res = await fetch(url, {
            ...options, // SPREAD USER OPTIONS (METHOD, HEADERS, ETC)
            signal: controller.signal, // ATTACH ABORT SIGNAL
        });

        clearTimeout(timeout); // CLEAR TIMEOUT ON SUCCESS

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

        // CHECK ARRAY ENTRIES (IF ARRAY)
        if (isArray) {
            const allObjects = data.every(p => p && typeof p==="object");
            if (!allObjects)
                throw new Error(`${url} → ARRAY CONTAINS NON-OBJECT ENTRIES`);
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
        const isDev = options.debug ?? true; // ENABLE LOG BY DEFAULT
        if (isDev) {
            console.error("validateJSON.js ERROR", url, "→", err.name, err.message, err.stack); // LOG ERROR FOR DEBUGGING
        }
        throw err; // RE-THROW FOR EXTERNAL HANDLING
    }
}