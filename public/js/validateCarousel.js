/*!
 * @fileoverview validateCarousel.js – FETCHES AND VALIDATES A JSON FILE CONTAINING CAROUSEL ENTRIES
 *
 * @author © 2025 sandokan.cat – https://sandokan.cat
 * @license MIT – https://opensource.org/licenses/MIT
 * @version 1.0.0
 * @since 1.0.0
 * @date 2025-07-30
 * @see https://open-utils-dev-sandokan-cat.vercel.app/js/README.md
 *
 * @description
 * Validates a remote or local JSON file containing image data for a responsive, accessible carousel.
 * Ensures each entry includes properly formatted `srcSet` attributes, fallback images, and multilingual `alt` texts.
 * Applies optional structural rules via `validateJSON`, including timeouts, required keys, and content type enforcement.
 *
 * @module validateCarousel
 * @exports validateCarousel
 * @requires validateJSON
 * 
 * @async
 * @function validateCarousel
 *
 * @typedef {Object} CarouselEntry
 * @property {Object} webp                               - Contains only a `srcSet` string with paths and density descriptors
 * @property {string} webp.srcSet                        - Comma-separated image paths with 1x, 2x, 3x density
 * @property {Object} png                                - Contains a `srcSet` string and a `fallback` image path
 * @property {string} png.srcSet                         - Comma-separated image paths with 1x, 2x, 3x density
 * @property {string} png.fallback                       - Default fallback image path for browsers that don’t support srcSet
 * @property {Object.<string, string>} alt               - Dictionary of alt texts indexed by locale (e.g. en, es-ES)
 *
 * @typedef {Object} ValidateCarouselOptions
 * @property {number} [timeout=7000]                     - Timeout in ms for the fetch request
 * @property {boolean} [requireContent=true]             - Whether to reject if content is empty
 * @property {string} [allowedTypes="object"]            - Allowed types inside the array
 * @property {string[]} [requiredKeys=["id", "name"]]    - Keys that must exist in each object
 *
 * @param {string} url - Absolute or relative path to the carousel JSON file
 * @param {ValidateCarouselOptions} [options] - Optional configuration for validation rules
 *
 * @returns {Promise<CarouselEntry[]>} Resolves with validated entries, or rejects with error
 *
 * @throws {TypeError} If arguments have incorrect types or expected structure
 * @throws {Error} If JSON structure is invalid
 * @throws {Error} If duplicate image paths are found across entries
 * @throws {Error} If required keys or multipliers are missing in entries
 * @throws {FetchError} (from validateJSON) If the JSON file cannot be loaded
 *
 * @example
 * // Basic validation
 * const images = await validateCarousel('js/data/carousel.json');
 *
 * @example
 * // With custom timeout
 * const images = await validateCarousel('js/data/carousel.json', { timeout: 3000 });
 *
 * @example
 * // Structure of a valid entry (simplified)
 * {
 *   webp: { srcSet: "img1@1x.webp 1x, img1@2x.webp 2x, img1@3x.webp 3x" },
 *   png: {
 *     srcSet: "img1@1x.png 1x, img1@2x.png 2x, img1@3x.png 3x",
 *     fallback: "img1@3x.png"
 *   },
 *   alt: {
 *     "en-GB": "A calm sunrise in the forest",
 *     "es-ES": "Un amanecer tranquilo en el bosque",
 *     "ca-ES": "Un clarejar tranquil al bosc"
 *   }
 * }
 *
 * @internal Uses helper functions: isValidPath(), hasMultipliers(), fallbackInSrcSet()
 *
 * @todo Consider support for more formats (e.g., AVIF, TIFF, ICO)
 * @todo Parametrize required densities (e.g., accept only 2x or customize multipliers)
 * @todo Modularize fallback path inclusion rules for better reusability and clarity
 * @todo Add option to validate alt texts for all locales, not just one
 * @todo Implement schema validation for the entire carousel structure (e.g., using JSON Schema)
 * @todo Add detailed logging or reporting mode for easier debugging in development
 * @todo Add configuration for allowed image extensions and their priorities
 * @todo Improve duplicate path detection to support partial matches or similar filenames
 * @todo Add support for lazy-loading or progressive image attributes validation
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
			if (!keys.every(k => ['webp', 'png', 'alt'].includes(k)) || keys.length !== 3)                {
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

            // ALT TEXT MUST BE A NON-EMPTY OBJECT WITH VALID STRINGS
            if (typeof alt !== 'object' || alt === null || Array.isArray(alt)) {
                throw new Error(`${url} [index ${i}] → alt MUST BE A NON-EMPTY OBJECT`);
            }
            
            const validAlts = Object.values(alt).filter(text => typeof text === 'string' && text.trim().length > 5);
            
            if (validAlts.length === 0) {
                throw new Error(`${url} [index ${i}] → alt MUST CONTAIN AT LEAST ONE STRING > 5 CHARS`);
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
        
        throw err; // RE-THROW FOR EXTERNAL HANDLING
	}
}