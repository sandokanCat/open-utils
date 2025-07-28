/*!
 * validateJSON.js – Fetches and validates JSON files
 *
 * © 2025 sandokan.cat – https://sandokan.cat
 * Released under the MIT License – https://opensource.org/licenses/MIT
 *
 * @version 1.4.3
 * @author sandokan.cat
 *
 * USAGE EXAMPLE:
 * 
 * // Validate JSON from URL with options (can be edited to fit your needs):
 * const data = await validateJSON("data.json", {
 *   timeout: 5000,                 // max time to wait for response in ms (default 7000)
 *   requireContent: true,          // fail if JSON array/object is empty (default true)
 *   allowedTypes: "object,string", // ensure array entries are of these types (default "object")
 *   requiredKeys: ["id", "name"],  // ensure each object in array has at least one of these keys (only for arrays)
 *   // You can also add fetch options like method, headers, debug mode, etc.
 * });
 *
 * // data will be either an array of objects or an object of objects,
 * // ready to use in your app with confidence that structure is valid.
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