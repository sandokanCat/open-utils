/*!
 * validateCarousel.js – HTTP API endpoint to validate JSON carousel images
 *
 * © 2025 sandokan.cat – https://sandokancat.github.io/CV/
 * Released under the MIT License – https://opensource.org/licenses/MIT
 *
 * @version 1.0.3
 * @author sandokan.cat
 *
 * QUERY PARAMETERS:
 * - url (required): remote JSON URL with carousel image data
 * - debug (optional): 'false' to silence server logs (default: true)
 *
 * RESPONSE:
 * - { valid: true, data: [...] } → validated array of images
 * - { valid: false, error: "..." } → on failure
 */

export default async function handler(req, res) {
	// CORS HEADERS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') return res.status(200).end();

	// PARSE QUERY
	const { url, debug } = req.query;
	if (!url) {
		return res.status(400).json({ valid: false, error: "Missing 'url' parameter" });
	}

	try {
		// FETCH JSON
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

		const contentType = response.headers.get("content-type")?.toLowerCase();
		if (!contentType || !contentType.includes("json"))
			throw new Error(`INVALID TYPE: ${contentType}`);

		const imgs = await response.json();

		// BASE STRUCTURE CHECK
		if (!Array.isArray(imgs))
			throw new Error("JSON MUST BE AN ARRAY");

		if (imgs.length < 2)
			throw new Error("AT LEAST 2 VALID IMAGES REQUIRED");

		const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.bmp', '.tiff', '.ico'];

		// HELPER FUNCTIONS
		const isValidPath = (srcSet, fallback = null) => {
			if (typeof srcSet !== 'string') return false;
			const entries = srcSet.split(',');
			const allValid = entries.every(src => {
				const path = src.trim().split(' ')[0];
				return validExtensions.some(ext => path.endsWith(ext));
			});
			const fallbackValid = !fallback || validExtensions.some(ext => fallback.endsWith(ext));
			return allValid && fallbackValid;
		};

		const hasMultipliers = (srcSet) => ['1x', '2x', '3x'].every(mult => srcSet.includes(mult));
		const fallbackInSrcSet = (srcSet, fallback) => srcSet?.includes(fallback);

		// VALIDATE EACH ENTRY
		for (let i = 0; i < imgs.length; i++) {
			const entry = imgs[i];
			const keys = Object.keys(entry);

			// ENSURE ENTRY HAS EXACTLY 3 KEYS: webp, png, alt
			if (keys.length !== 3 || !keys.includes('webp') || !keys.includes('png') || !keys.includes('alt'))
				throw new Error(`Index ${i} → MUST HAVE KEYS: webp, png, alt`);

			const { webp, png, alt } = entry;

			const webpKeys = Object.keys(webp);
			const pngKeys = Object.keys(png);

			// ENSURE webp ONLY HAS srcSet
			if (webpKeys.length !== 1 || !webpKeys.includes('srcSet'))
				throw new Error(`Index ${i} → webp MUST HAVE KEY: srcSet`);

			if (pngKeys.length !== 2 || !pngKeys.includes('srcSet') || !pngKeys.includes('fallback'))
				throw new Error(`Index ${i} → png MUST HAVE KEYS: srcSet, fallback`);

			// ENSURE alt IS A NON-EMPTY STRING
			if (typeof alt !== 'string' || alt.trim().length <= 5)
				throw new Error(`Index ${i} → alt MUST BE STRING > 5 CHARS`);

			if (!isValidPath(webp.srcSet))
				throw new Error(`Index ${i} → INVALID webp.srcSet`);

			if (!hasMultipliers(webp.srcSet))
				throw new Error(`Index ${i} → webp.srcSet MUST INCLUDE 1x, 2x, 3x`);

			if (!isValidPath(png.srcSet, png.fallback))
				throw new Error(`Index ${i} → INVALID png.srcSet OR fallback`);

			if (!fallbackInSrcSet(png.srcSet, png.fallback))
				throw new Error(`Index ${i} → fallback MUST EXIST IN png.srcSet`);

			if (!hasMultipliers(png.srcSet))
				throw new Error(`Index ${i} → png.srcSet MUST INCLUDE 1x, 2x, 3x`);
		}

		// ENSURE THERE ARE NO DUPLICATE PATHS ACROSS ENTRIES
		const globalPaths = new Map();

		for (let i = 0; i < imgs.length; i++) {
			const { webp, png } = imgs[i];
			
			const localPaths = [
				...(webp?.srcSet?.split(',') || []).map(s => s.trim().split(' ')[0]),
				...(png?.srcSet?.split(',') || []).map(s => s.trim().split(' ')[0]),
				png?.fallback
			].filter(Boolean);
			
			for (const path of localPaths) {
				if (globalPaths.has(path)) {
				const prevIndex = globalPaths.get(path);
					if (prevIndex !== i) {
						throw new Error(`${url} → DUPLICATE IMAGE PATH DETECTED ACROSS OBJECTS: ${path}`);
					}
				} else {
					globalPaths.set(path, i);
				}
			}
		}

		// SUCCESS
		return res.status(200).json({ valid: true, data: imgs });

	} catch (err) {
		const isDev = debug !== "false";
        if (isDev) {
            console.error("validateCarousel API →", url, "→", err.name, err.message, err.stack);
        }
        return res.status(500).json({ valid: false, error: err.message });
	}
}