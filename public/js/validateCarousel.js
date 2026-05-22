/*!
 * @fileoverview validateCarousel.js – FETCHES, VALIDATES AND PARSES CAROUSEL JSON CONFIGURATIONS
 *
 * @author © 2026 sandokan.cat – https://sandokan.cat
 * @license MIT – https://opensource.org/licenses/MIT
 * @version 2.0.0
 * @since 1.0.0
 * @date 2026-05-22
 * @see https://open-utils-dev-sandokan-cat.vercel.app/js/README.md
 *
 * @description
 * Validates a remote or local JSON file containing image data for a responsive, accessible carousel.
 * Supports both a legacy flat array structure and a modern hierarchical stack-based configuration.
 * For hierarchical JSON, it dynamically reconstructs responsive image paths using the defined scales
 * and string extensions, translating them into the standard flat CarouselEntry structure.
 * Applies structural constraints and sanity validations (duplicate paths, minimum image count, alt texts length).
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
 * @returns {Promise<CarouselEntry[]>} Resolves with validated and parsed entries, or rejects with error
 *
 * @throws {TypeError} If arguments have incorrect types or expected structure
 * @throws {Error} If JSON structure is invalid or extensions are not whitelisted
 * @throws {Error} If duplicate image paths are found across entries
 * @throws {Error} If required multipliers are missing in entries
 * @throws {FetchError} (from validateJSON) If the JSON file cannot be loaded
 *
 * @example
 * // Basic validation (works for both flat array and hierarchical configurations)
 * const images = await validateCarousel('js/data/carousel.json');
 *
 * @example
 * // With custom timeout
 * const images = await validateCarousel('js/data/carousel.json', { timeout: 3000 });
 *
 * @example
 * // Structure of a hierarchical JSON configuration (v2.0.0)
 * {
 *   "mainDir": "img/carousel/",
 *   "scales": {
 *     "3x": "@3x",
 *     "2x": "@2x",
 *     "1x": "@1x"
 *   },
 *   "stacks": {
 *     "backend": {
 *       "stackDir": "backend/",
 *       "ext": ".jpg",
 *       "types": {
 *         "python": {
 *           "typeDir": "python/",
 *           "files": {
 *             "py": {
 *               "name": "PYTHON_certificate",
 *               "alt": {
 *                 "en-GB": "Introduction to Python certificate",
 *                 "es-ES": "Certificado de introducción a Python"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * @internal Uses helper functions: isValidPath(), hasMultipliers(), fallbackInSrcSet()
 *
 * @todo Consider support for more formats (e.g., AVIF, TIFF, ICO)
 * @todo Modularize fallback path inclusion rules for better reusability and clarity
 * @todo Add option to validate alt texts for all locales, not just one
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

	// AUX: CHECK MULTIPLIERS EXIST IN srcSet
	const hasMultipliers = (srcSet, scaleKeys) => scaleKeys.every(mult => srcSet.includes(mult));

	// AUX: ENSURE fallback FILE IS PART OF srcSet
	const fallbackInSrcSet = (srcSet, fallback) => {
		if (!srcSet || !fallback) return false;
		return srcSet.includes(fallback);
	};

	try {
		// FETCH + BASE STRUCTURE VALIDATION
		const carouselData = await validateJSON(url);

		let imgs = [];

		if (Array.isArray(carouselData)) {
			// Legacy flat array structure
			imgs = carouselData;
			
			// Strict entry validation (per image object)
			for (let i = 0; i < imgs.length; i++) {
				const entry = imgs[i];

				// KEYS MUST BE EXACTLY: webp, png, alt
				const keys = Object.keys(entry);
				if (!keys.every(k => ['webp', 'png', 'alt'].includes(k)) || keys.length !== 3) {
					throw new Error(`${url} [index ${i}] → ENTRY MUST HAVE EXACT KEYS: webp, png, alt`);
				}

				const { webp, png, alt } = entry;

				// KEYS INSIDE webp AND png MUST BE EXACT
				const webpKeys = Object.keys(webp);
				const pngKeys = Object.keys(png);

				if (webpKeys.length !== 1 || !webpKeys.includes('srcSet')) {
					throw new Error(`${url} [index ${i}] → webp MUST HAVE EXACT KEY: srcSet`);
				}
				if (pngKeys.length !== 2 || !pngKeys.includes('srcSet') || !pngKeys.includes('fallback')) {
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
				if (!hasMultipliers(webp.srcSet, ['1x', '2x', '3x'])) {
					throw new Error(`${url} [index ${i}] → webp srcSet MISSING 1x, 2x, or 3x multipliers`);
				}

				// VALIDATE PATHS AND MULTIPLIERS FOR png
				if (!isValidPath(png.srcSet, png.fallback)) {
					throw new Error(`${url} [index ${i}] → png srcSet or fallback paths INVALID`);
				}
				if (!fallbackInSrcSet(png.srcSet, png.fallback)) {
					throw new Error(`${url} [index ${i}] → png fallback NOT INCLUDED in srcSet`);
				}
				if (!hasMultipliers(png.srcSet, ['1x', '2x', '3x'])) {
					throw new Error(`${url} [index ${i}] → png srcSet MISSING 1x, 2x, or 3x multipliers`);
				}
			}
		} else if (typeof carouselData === 'object' && carouselData !== null) {
			// Hierarchical object structure
			const mainDir = carouselData.mainDir || 'img/carousel/';
			const scales = carouselData.scales || { "3x": "@3x", "2x": "@2x", "1x": "@1x" };
			const scaleKeys = Object.keys(scales);
			const highestScaleVal = Object.values(scales)[0] || '@3x';

			if (carouselData.stacks) {
				for (const [stackKey, stack] of Object.entries(carouselData.stacks)) {
					const stackDir = stack.stackDir || '';
					const stackExt = stack.ext || null;

					if (stack.types) {
						for (const [typeKey, type] of Object.entries(stack.types)) {
							const typeDir = type.typeDir || type.dir || '';
							const typeExt = type.ext || stackExt;

							if (type.files) {
								const filesGroup = [];
								if (type.files.name) {
									filesGroup.push(type.files);
								} else {
									for (const fileObj of Object.values(type.files)) {
										if (typeof fileObj === 'object' && fileObj !== null) {
											filesGroup.push(fileObj);
										}
									}
								}

								for (const fileObj of filesGroup) {
									const fileName = fileObj.name;
									const alt = fileObj.alt || {};
									if (fileName) {
										const dirPath = mainDir + stackDir + typeDir;
										
										let fallbackExt = fileObj.ext || typeExt || '.png';
										if (!fallbackExt.startsWith('.')) {
											fallbackExt = '.' + fallbackExt;
										}

										if (!validExtensions.includes(fallbackExt)) {
											throw new Error(`Extension ${fallbackExt} is not valid. Must be one of ${validExtensions.join(', ')}`);
										}

										const webpSrcSet = Object.entries(scales).map(([scaleKey, scaleVal]) => {
											return `${dirPath}${fileName}${scaleVal}.webp ${scaleKey}`;
										}).join(', ');

										const pngSrcSet = Object.entries(scales).map(([scaleKey, scaleVal]) => {
											return `${dirPath}${fileName}${scaleVal}${fallbackExt} ${scaleKey}`;
										}).join(', ');

										const fallback = `${dirPath}${fileName}${highestScaleVal}${fallbackExt}`;

										// Validate Alt
										if (typeof alt !== 'object' || alt === null || Array.isArray(alt)) {
											throw new Error(`${url} [file ${fileName}] → alt MUST BE A NON-EMPTY OBJECT`);
										}
										const validAlts = Object.values(alt).filter(text => typeof text === 'string' && text.trim().length > 5);
										if (validAlts.length === 0) {
											throw new Error(`${url} [file ${fileName}] → alt MUST CONTAIN AT LEAST ONE STRING > 5 CHARS`);
										}

										// Validate generated paths
										if (!isValidPath(webpSrcSet)) {
											throw new Error(`${url} [file ${fileName}] → generated webp srcSet paths INVALID`);
										}
										if (!hasMultipliers(webpSrcSet, scaleKeys)) {
											throw new Error(`${url} [file ${fileName}] → generated webp srcSet MISSING multipliers: ${scaleKeys.join(', ')}`);
										}
										if (!isValidPath(pngSrcSet, fallback)) {
											throw new Error(`${url} [file ${fileName}] → generated png/jpg srcSet or fallback paths INVALID`);
										}
										if (!fallbackInSrcSet(pngSrcSet, fallback)) {
											throw new Error(`${url} [file ${fileName}] → generated fallback NOT INCLUDED in srcSet`);
										}
										if (!hasMultipliers(pngSrcSet, scaleKeys)) {
											throw new Error(`${url} [file ${fileName}] → generated png/jpg srcSet MISSING multipliers: ${scaleKeys.join(', ')}`);
										}

										imgs.push({
											webp: { srcSet: webpSrcSet },
											png: {
												srcSet: pngSrcSet,
												fallback: fallback
											},
											alt: alt
										});
									}
								}
							}
						}
					}
				}
			}
		} else {
			throw new Error(`${url} → MUST RETURN AN ARRAY OR OBJECT`);
		}

		// VALIDATE MINIMUM IMAGE COUNT
		if (imgs.length < 2) {
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