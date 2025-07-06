export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, timeout, requiredKeys, requireContent, debug } = req.query;

    if (!url) {
        return res.status(400).json({ valid: false, error: "Missing 'url' parameter" });
    }

    try {
        const controller = new AbortController();
        const wait = parseInt(timeout) || 7000;
        const timer = setTimeout(() => controller.abort(), wait);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!response.ok)
            throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.toLowerCase().includes("json"))
            throw new Error(`INVALID TYPE: ${contentType}`);

        const data = await response.json();

        const isArray = Array.isArray(data);
        const isObject = typeof data === "object" && data !== null;

        if (!isArray && !isObject)
            throw new Error("JSON MUST BE ARRAY OR OBJECT");

        if (isArray) {
            const allObjects = data.every(p => p && typeof p === "object");
            if (!allObjects)
                throw new Error("ARRAY CONTAINS NON-OBJECT ENTRIES");
        }

        const requireData = requireContent !== "false";
        if (requireData) {
            if (isArray && data.length === 0)
                throw new Error("EMPTY ARRAY");
            if (isObject && Object.keys(data).length === 0)
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
        const isDev = debug !== "false";
        if (isDev) {
            console.error("validateJSON API →", url, "→", err.name, err.message);
        }
        return res.status(500).json({ valid: false, error: err.message });
    }
}
