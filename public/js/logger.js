/*!
 * @fileoverview logger.js – CLIENT-SIDE DEVELOPMENT LOGGER WITH MULTI-LEVEL CONSOLE WRAPPERS AND DYNAMIC ENV CHECKS
 *
 * @author © 2025 sandokan.cat – https://sandokan.cat
 * @license MIT – https://opensource.org/licenses/MIT
 * @version 1.1.0
 * @since 1.0.0
 * @date 2025-08-05
 * @see https://open-utils-dev-sandokan-cat.vercel.app/js/README.md
 *
 * @description
 * This module provides enhanced logging utilities for browser-based development.
 * Logs are environment-aware (development only) and can be globally silenced via localStorage.
 * It supports standard and custom log levels with fallback handling for invalid ones.
 * It also wraps advanced console methods like groups, timers, counters, and structured outputs.
 *
 * @module logger
 * @exports default – `logger` object with logging methods and controls.
 *
 * @typedef {Object} Logger
 * @property {Function} enable/en          – Explicitly enables logs via cookie
 * @property {Function} disable/ds         – Silences all logs regardless of environment
 * @property {Function} clear/cl           – Clears the console if enabled
 * @property {Function} error/er           – ❌ Logs errors
 * @property {Function} warn/wa            – ⚠️ Logs warnings
 * @property {Function} info/in            – ℹ️ Informational logs
 * @property {Function} debug/db           – 🛠️ Debug logs
 * @property {Function} log/lg             – 📋 Standard logs (console.log)
 * @property {Function} trace/tr           – 🔎 Stack traces
 * @property {Function} assert/as          – 🚨 Conditional assertions
 * @property {Function} dir/di             – 📂 Object structures
 * @property {Function} table/tb           – 📊 Tabular data
 * @property {Function} count/ct           – 🔢 Increments a named counter
 * @property {Function} countReset/cr      – 🔄 Resets a named counter
 * @property {Function} time/tm            – ⏱️ Starts a timer
 * @property {Function} timeEnd/te         – 💥 Ends and logs a timer
 * @property {Function} timeLog/tl         – ⌛ Logs intermediate timer value
 * @property {Function} group/gp           – 📦 Expanded log group
 * @property {Function} groupCollapse/gc   – 👉 Collapsed log group
 *
 * @param {string} [label="default"] – Optional label for timers, counters, or groups
 * @param {boolean} [condition] – Boolean condition for logAssert
 * @param {...any} args – Arguments to be logged
 *
 * @returns {void}
 *
 * @throws {TypeError} – Rare: incorrect parameter types
 *
 * @example
 * import logger from './logger.js';
 * logger.info('Logger initialized');
 * logger.error("Something went wrong", error);
 * logger.group("Fetch Results", () => {
 *     logger.normal("User:", user);
 *     logger.table(data);
 * });
 * // To silence logs:
 * logger.disable();
 *
 * @internal
 * Invalid log levels are caught and deferred using setTimeout.
 *
 * @todo Add optional log persistence using localStorage (for post-reload debugging)
 * @todo Allow custom icon override or log styling via config
 */

/* GLOBAL CONSTANTS */
const isDev = (
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    import.meta.env.MODE === 'development'
) || ['localhost', '127.0.0.1', '0.0.0.0', 'sandokancat.github.io', 'sandokan.cat'].includes(location.hostname);

const getCookie = name => document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1];
const isSilent = getCookie('log:silent') === 'true';
const forceLogs = getCookie('log:force') === 'true';

const icons = {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🛠️',
    log: '📋',
    trace: '🔎',
    assert: '🚨',
    group: '📦',
    groupCollapse: '👉',
    dir: '📂',
    table: '📊',
    count: '🔢',
    countReset: '🔄',
    time: '⏱️',
    timeEnd: '💥',
    timeLog: '⌛'
};

const invalidLogsByLevel = new Map();

/* MAIN LOGGER FUNCTION */
const log = (level = 'log', ...args) => {
    if ((!isDev && !forceLogs) || isSilent) return; // SKIP IF NOT ALLOWED

    const timestamp = `%c${new Date().toLocaleString()}%c\n`; // GET CURRENT DATE
    const timestampStyle = 'color: rgba(150, 150, 150, 0.5); font-size: 0.85em'; // STYLE TIMESTAMP

    const icon = icons[level] ?? '📋'; // PICK ICON
    const isCallback = typeof args[args.length - 1] === 'function';
    const callback = isCallback ? args.pop() : undefined; // EXTRACT CALLBACK

    if (level === 'group') {
        logGrouped(level, args, false, callback, `${timestamp}`, timestampStyle); // EXPANDED GROUP

    } else if (['groupCollapse', 'dir', 'table', 'count', 'countReset', 'time', 'timeEnd', 'timeLog'].includes(level)) {
        logGrouped(level, args, true, callback, `${timestamp}`, timestampStyle); // GROUPED BEHAVIOUR FOR CERTAIN LEVELS

    } else {
        // PREFIX ICON + TIMESTAMP
        const firstStringIndex = args.findIndex(arg => typeof arg === 'string');
        if (firstStringIndex !== -1) {
            const originalStr = args[firstStringIndex];
            const originalStyles = args.slice(firstStringIndex + 1);
            const parts = originalStr.split('%c');

            let newStr = `${icon} ${timestamp}` + parts.map((part, idx) => (idx > 0 ? '%c' : '') + part).join('');

            const newStyles = [timestampStyle, '', ...originalStyles.length ? originalStyles : []];

            args.splice(firstStringIndex, args.length - firstStringIndex, newStr, ...newStyles);
        } else {
            args.unshift(`${icon} ${timestamp}`, timestampStyle);
        }

        if (level ==='assert') {
            const [condition, ...rest] = args; // ASSERT USAGE: CONDITION, THEN MESSAGE(S)
            console.assert(condition, ...rest);
        } else {
            // DEFAULT LOG LEVELS
            const method = typeof console[level] === 'function' ? console[level] : console.log;
            method(...args);
            if (!console[level]) handleInvalidLevel(level, timestamp, args);
        }
    }
};

/* GROUPS LOGS BY LEVEL */
function logGrouped(level, args = [], collapsed = true, callback, timestamp = new Date().toLocaleString(), timestampStyle) {
    const groupFn = collapsed ? console.groupCollapsed : console.group;
    const title = args.length && typeof args[0] === 'string' ? args[0] : '';
    const restArgs = args.slice(1);
    const headerStyle = 'font-weight: bold; text-transform: uppercase;';
    const header = `${icons[level] ?? icons.group} %c${title} ${timestamp}`.trim();

    groupFn(header, headerStyle, timestampStyle);

    const method = typeof console[level] === 'function' ? console[level] : console.log;
    if (typeof callback === 'function') callback();
    else restArgs.forEach(arg => method(arg));

    console.groupEnd();
}

/* HANDLES FALLBACK FOR UNKNOWN LOG LEVELS */
const handleInvalidLevel = (level, timestamp, args) => {
    if (!invalidLogsByLevel.has(level)) invalidLogsByLevel.set(level, []); // INIT BUCKET
    invalidLogsByLevel.get(level).push({ timestamp, args }); // STORE LOG ENTRY

    if (invalidLogsByLevel.get(level).length === 1) {
        setTimeout(() => {
            const logs = invalidLogsByLevel.get(level);
            console.group(`${icons.group} Invalid log level: "${level}" — Fallback to console.log`);
            logs.forEach(({ timestamp, args }) => {
                console.log(timestamp, ...args); // PRINT STORED ENTRIES
            });
            console.groupEnd();
            invalidLogsByLevel.delete(level);
        }, 0);
    }
};

/* LOGGER API EXPORT */
const logger = {
    enable: () => document.cookie = 'log:silent=false; path=/; max-age=31536000',
    en: () => document.cookie = 'log:silent=false; path=/; max-age=31536000',
  
    disable: () => document.cookie = 'log:silent=true; path=/; max-age=31536000',
    ds: () => document.cookie = 'log:silent=true; path=/; max-age=31536000',
  
    clear: () => { if (isDev && !isSilent) console.clear(); },
    cl: () => { if (isDev && !isSilent) console.clear(); },
  
    custom: (level, ...args) => log(level, ...args),
    cu: (level, ...args) => log(level, ...args),
  
    error: (...args) => log('error', ...args),
    er: (...args) => log('error', ...args),
  
    warn: (...args) => log('warn', ...args),
    wa: (...args) => log('warn', ...args),
  
    info: (...args) => log('info', ...args),
    in: (...args) => log('info', ...args),
  
    debug: (...args) => log('debug', ...args),
    db: (...args) => log('debug', ...args),
  
    log: (...args) => log('log', ...args),
    lg: (...args) => log('log', ...args),
  
    trace: (...args) => log('trace', ...args),
    tr: (...args) => log('trace', ...args),
  
    assert: (condition, ...args) => log('assert', condition, ...args),
    as: (condition, ...args) => log('assert', condition, ...args),
  
    dir: (...args) => log('dir', ...args),
    di: (...args) => log('dir', ...args),
  
    table: (...args) => log('table', ...args),
    tb: (...args) => log('table', ...args),
  
    count: (...args) => log('count', ...args),
    ct: (...args) => log('count', ...args),
  
    countReset: (...args) => log('countReset', ...args),
    cr: (...args) => log('countReset', ...args),
  
    time: (...args) => log('time', ...args),
    tm: (...args) => log('time', ...args),
  
    timeEnd: (...args) => log('timeEnd', ...args),
    te: (...args) => log('timeEnd', ...args),
  
    timeLog: (...args) => log('timeLog', ...args),
    tl: (...args) => log('timeLog', ...args),
  
    group: (label, callback) => log('group', label, callback),
    gp: (label, callback) => log('group', label, callback),
  
    groupCollapse: (label, callback) => log('groupCollapse', label, callback),
    gc: (label, callback) => log('groupCollapse', label, callback),
};  

export default logger;
