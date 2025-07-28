/*!
 * validateCarousel.js – Fetches and validates carousel image entries
 *
 * © 2025 sandokan.cat – https://sandokan.cat
 * Released under the MIT License – https://opensource.org/licenses/MIT
 *
 * @version 1.2.8
 * @author sandokan.cat
 *
 * DESCRIPTION:
 * This module fetches and validates a JSON file containing image entries
 * structured for a responsive carousel, ensuring structure, format and
 * accessibility are correct.
 *
 * USAGE EXAMPLES:
 * const validImgs = await validateCarousel("js/data/carousel.json");
 */

// IMPORT DEPENDENCIES
import { validateJSON } from './validateJSON.js';

// FETCH + VALIDATE IMAGE ENTRIES STRICTLY
export async function validateCarousel(url, options = {}) {
	const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.bmp', '.tiff', '.ico'];

	// AUX: CHECK EACH PATH HAS VALID EXTENSION
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

	// AUX: CHECK 1x, 2x, 3x EXIST IN srcSet
	const hasMultipliers = (srcSet) => ['1x', '2x', '3x'].every(mult => srcSet.includes(mult));

	// AUX: ENSURE fallback FILE IS PART OF srcSet
	const fallbackInSrcSet = (srcSet, fallback) => {
		if (!srcSet || !fallback) return false;
		return srcSet.includes(fallback);
	};

	try {
		// FETCH + BASE STRUCTURE VALIDATION
		const imgs = await validateJSON(url);

		if (!Array.isArray(imgs)) throw new Error(`${url} → MUST RETURN AN ARRAY`);

		// STRICT ENTRY VALIDATION (PER IMAGE OBJECT)
		for (let i=0; i<imgs.length; i++) {
			const entry = imgs[i];

			// KEYS MUST BE EXACTLY: webp, png, alt
			const keys = Object.keys(entry);
			if (keys.length!==3 || !keys.includes('webp') || !keys.includes('png') || !keys.includes('alt')) {
				throw new Error(`${url} [index ${i}] → ENTRY MUST HAVE EXACT KEYS: webp, png, alt`);
			}

			const { webp, png, alt } = entry;

			// KEYS INSIDE webp AND png MUST BE EXACT
			const webpKeys = Object.keys(webp);
			const pngKeys = Object.keys(png);

			if (webpKeys.length!==1 || !webpKeys.includes('srcSet')) {
				throw new Error(`${url} [index ${i}] → webp MUST HAVE EXACT KEY: srcSet`);
			}
			if (pngKeys.length!==2 || !pngKeys.includes('srcSet') || !pngKeys.includes('fallback')) {
				throw new Error(`${url} [index ${i}] → png MUST HAVE EXACT KEYS: srcSet, fallback`);
			}

			// ALT TEXT MUST BE STRING > 5 CHARS
			if (typeof alt !== 'string' || alt.trim().length <= 5) {
				throw new Error(`${url} [index ${i}] → alt MUST BE STRING > 5 CHARS`);
			}

			// VALIDATE PATHS AND MULTIPLIERS FOR webp
			if (!isValidPath(webp.srcSet)) {
				throw new Error(`${url} [index ${i}] → webp srcSet paths INVALID`);
			}
			if (!hasMultipliers(webp.srcSet)) {
				throw new Error(`${url} [index ${i}] → webp srcSet MISSING 1x, 2x, or 3x multipliers`);
			}

			// VALIDATE PATHS AND MULTIPLIERS FOR png
			if (!isValidPath(png.srcSet, png.fallback)) {
				throw new Error(`${url} [index ${i}] → png srcSet or fallback paths INVALID`);
			}
			if (!fallbackInSrcSet(png.srcSet, png.fallback)) {
				throw new Error(`${url} [index ${i}] → png fallback NOT INCLUDED in srcSet`);
			}
			if (!hasMultipliers(png.srcSet)) {
				throw new Error(`${url} [index ${i}] → png srcSet MISSING 1x, 2x, or 3x multipliers`);
			}
		}

		// VALIDATE MINIMUM IMAGE COUNT
		if (imgs.length<2) {
			throw new Error(`${url} → AT LEAST 2 VALID IMAGES REQUIRED (${imgs.length} found)`);
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


		return imgs; // RETURN ONLY IF FULLY VALID

	} catch (err) {
		console.error("validateCarousel.js ERROR", url, "→", err.name, err.message, err.stack); // LOG ERROR FOR DEBUGGING
	}

	throw err; // RE-THROW FOR EXTERNAL HANDLING
}