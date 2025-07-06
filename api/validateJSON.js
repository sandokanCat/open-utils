export default async function handler(req, res) {
    const { jsonUrl, timeout, requiredKeys, requireContent, debug } = req.query;

    if (!jsonUrl) {
        return res.status(400).json({ error: "Missing 'jsonUrl' parameter" });
    }

    try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), parseInt(timeout) || 7000);

        const fetchRes = await fetch(jsonUrl, { signal: controller.signal });
        clearTimeout(to);

        if (!fetchRes.ok)
            throw new Error(`HTTP ${fetchRes.status} ${fetchRes.statusText}`);

        const contentType = fetchRes.headers.get("content-type");
        if (!contentType || !contentType.toLowerCase().includes("json"))
            throw new Error(`INVALID TYPE: ${contentType}`);

        const data = await fetchRes.json();

        const isArray = Array.isArray(data);
        const isObject = typeof data === "object" && data !== null;

        if (!isArray && !isObject)
            throw new Error(`INVALID JSON ROOT`);

        if (isArray) {
            const allObjects = data.every(p => p && typeof p === "object");
            if (!allObjects)
                throw new Error("ARRAY CONTAINS NON-OBJECT ENTRIES");
        }

        if (requireContent !== "false") {
            if (isArray && !data.length)
                throw new Error("EMPTY ARRAY");
            if (isObject && !Object.keys(data).length)
                throw new Error("EMPTY OBJECT");
        }

        if (requiredKeys && isArray) {
            const keys = requiredKeys.split(",");
            const allValid = data.every(obj =>
                keys.every(key => Object.prototype.hasOwnProperty.call(obj, key))
            );
            if (!allValid)
                throw new Error(`MISSING REQUIRED KEYS: ${keys.join(", ")}`);
        }

        return res.status(200).json({ valid: true, data });

    } catch (err) {
        if (debug !== "false") {
            console.error("validateJSON API →", err.name, err.message);
        }
        return res.status(500).json({ valid: false, error: err.message });
    }
}