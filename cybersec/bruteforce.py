#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
@fileoverview bruteforce.py - ACADEMIC HASH BRUTEFORCE TOOL USING PASSWORD+SALT WORDLISTS

@author © 2025 sandokan.cat – https://sandokan.cat
@license MIT – https://opensource.org/licenses/MIT
@version 1.0.0
@since 1.0.0
@date 2025-07-30
@see https://github.com/sandokanCat/open-utils/blob/main/cybersec/README.md

@description
Academic hash bruteforce tool using password+salt combinations.
Designed for cybersecurity students and Red Team labs.
Supports 14+ algorithms, multi-hash mode, custom wordlists, JSON output, and stdin piping.
Parallelized via multiprocessing with progress bar.

@param {str} target_hash           – Single target hash to crack (optional)
@param {str} hash_file             – File containing multiple hashes (optional)
@param {bool} stdin_mode           – Read hashes from standard input (optional)
@param {int} hash_length           – Length of the hash for algorithm inference (optional)
@param {str} algo                  – Force a specific hashing algorithm (optional)
@param {str} custom_wordlist       – Path to an additional custom wordlist (optional)
@param {str} mode                  – Combination mode: "ps", "sp", or "both"
@param {int} threads               – Number of parallel processes (default: CPU cores)
@param {str} save_file             – File path to save cracked results (optional)
@param {str} json                  – File path to export results in JSON format (optional)
@param {str} log                   – File path for logging warnings (default: "bruteforce.log")
@param {bool} quiet                – Suppress verbose output (default: False)

@returns {int} Exit code: 0 on success, non-zero on failure

@example
$ python bruteforce.py --target-hash 5f4dcc3b5aa765d61d8327deb882cf99
$ python bruteforce.py --hash-file hashes.txt --hash-length 32 --custom-wordlist mylist.txt --threads 4

@internal
This tool is intended strictly for academic and authorized testing purposes.
Not suitable for production or large scale brute forcing.
Ensure legal and ethical use at all times.

@todo GPU support (via PyOpenCL or hashcat bridge)
@todo Wordlist resume (for large datasets)
@todo Salt file mode (e.g., separate salt files)
@todo Modular API version
@todo Add comprehensive unit tests for all supported algorithms
@todo Enhance logging and progress reporting
"""

import argparse
import hashlib
import logging
import os
import json
import sys
import atexit
from time import time
from datetime import datetime
from multiprocessing import Pool, cpu_count
from tqdm import tqdm

if sys.platform.startswith("win"):
    import ctypes
    ctypes.windll.kernel32.SetConsoleOutputCP(65001)

# ===== CONFIGURATION ===== #
HASH_ALGORITHMS = [
    "md5", "sha1", "sha256", "sha512", "sha3_256", "sha3_512",
    "sha224", "sha384", "blake2b", "blake2s", "sha3_224",
    "sha3_384", "shake_128", "shake_256"
]

HASH_LENGTH_MAP = {
    32: ["md5"],
    40: ["sha1"],
    56: ["sha224"],
    64: ["sha256", "sha3_256", "blake2s"],
    96: ["sha384", "sha3_384"],
    128: ["sha512", "sha3_512", "blake2b"]
}

GENERIC_WORDLISTS = [
    "wordlist/10k-most-common.txt",
    "wordlist/rockyou.txt"
]

start_time = time()
atexit.register(lambda: print(f"⏱️ Elapsed time: {time() - start_time:.2f} seconds"))

# ===== CLI ARGUMENTS ===== #
def parse_args():
    parser = argparse.ArgumentParser(
        description="🔓 Academic Hash Bruteforce Tool (password+salt)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    # MAIN INPUT
    parser.add_argument("-x", "--target-hash", help="Single target hash to crack")
    parser.add_argument("-f", "--hash-file", help="File containing one hash per line")
    parser.add_argument("-d", "--stdin-mode", action="store_true", help="Read target hash from standard input (stdin)")

    # FILTERING / ALGORITHM
    parser.add_argument("-n", "--hash-length", type=int, help="Infer algorithm(s) by hash length")
    parser.add_argument("-a", "--algo", choices=HASH_ALGORITHMS, help="Force algorithm")

    # WORDLISTS / MODE
    parser.add_argument("-w", "--custom-wordlist", help="Add an extra custom wordlist")
    parser.add_argument("-m", "--mode", choices=["ps", "sp", "both"], default="both", help="Combination mode")

    # PERFORMANCE
    parser.add_argument("-t", "--threads", type=int, default=cpu_count(), help="Number of parallel processes")

    # OUTPUT
    parser.add_argument("-s", "--save", metavar="FILE", dest="save_file", help="Save cracked results to a file")
    parser.add_argument("-j", "--json", metavar="FILE", help="Export result(s) to JSON")
    parser.add_argument("-l", "--log", metavar="FILE", default="bruteforce.log", help="Path to log file")

    # MISC
    parser.add_argument("-q", "--quiet", action="store_true", help="Suppress verbose output")
    parser.add_argument("-v", "--version", action="version", version="bruteforce.py 1.4.2 by sandokan.cat")

    return parser.parse_args()

# ===== UTILS ===== #
def configure_logging(logfile):
    logging.basicConfig(
        filename=logfile,
        level=logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

def info(msg, quiet=False):
    if not quiet:
        print(msg)

def hash_string(text, algorithm):
    hasher = getattr(hashlib, algorithm)
    return hasher(text.encode()).hexdigest(16) if algorithm.startswith("shake_") else hasher(text.encode()).hexdigest()

def get_algorithms(algo, hash_length):
    if algo:
        return [algo]
    if hash_length and hash_length in HASH_LENGTH_MAP:
        return HASH_LENGTH_MAP[hash_length]
    return HASH_ALGORITHMS

def get_wordlists(custom=None):
    return [custom] + GENERIC_WORDLISTS if custom else GENERIC_WORDLISTS

def write_result(filepath, algo, full_password, generated, quiet=False):
    try:
        timestamp = datetime.now().isoformat(sep=" ", timespec="seconds")
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(f"{timestamp} [{algo.upper()}] {full_password} → {generated}\n")
        info(f"💾 Saved to '{filepath}'", quiet)
    except Exception as e:
        logging.warning(f"Could not save to '{filepath}': {e}")

def write_json(filepath, data, quiet=False):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
        info(f"📄 JSON saved to '{filepath}'", quiet)
    except Exception as e:
        logging.warning(f"Could not save JSON to '{filepath}': {e}")

def check_combination(task):
    password, salt, algorithm, target_hash, mode = task
    combos = []
    if mode in ("ps", "both"):
        combos.append(password + salt)
    if mode in ("sp", "both"):
        combos.append(salt + password)
    for combo in combos:
        try:
            if hash_string(combo, algorithm) == target_hash:
                return (combo, algorithm)
        except Exception:
            pass

# ===== CORE FUNCTION ===== #
def attack_hash(target_hash, wordlists, algos, mode, threads, save_file=None, json_file=None, quiet=False):
    for wordlist in wordlists:
        if not os.path.exists(wordlist):
            info(f"⚠️ {wordlist} not found. Skipping...", quiet)
            continue
        with open(wordlist, "r", encoding="latin-1", errors="ignore") as f:
            words = [line.strip() for line in f if line.strip()]

        info(f"\n📂 Trying wordlist: {wordlist}", quiet)
        info(f"🔍 Loaded {len(words)} words...", quiet)

        tasks = [
            (pwd, salt, algo, target_hash, mode)
            for algo in algos
            for pwd in words
            for salt in words
        ]

        with Pool(threads) as pool:
            for result in tqdm(pool.imap_unordered(check_combination, tasks, chunksize=10000), total=len(tasks), desc="Progress", disable=quiet):
                if result:
                    full_password, algo = result
                    generated = hash_string(full_password, algo)
                    info(f"\n✅ SUCCESS! ({algo.upper()})", quiet)
                    info(f"🔑 Full password: '{full_password}'", quiet)
                    info(f"🔍 Generated Hash: {generated}", quiet)

                    if save_file:
                        write_result(save_file, algo, full_password, generated, quiet)
                    if json_file:
                        write_json(json_file, {
                            "found": True,
                            "hash": target_hash,
                            "algorithm": algo,
                            "password": full_password,
                            "generated": generated,
                            "elapsed_seconds": round(time() - start_time, 2)
                        }, quiet)

                    pool.terminate()
                    return True

    info(f"❌ Hash {target_hash} not found.", quiet)
    if json_file:
        write_json(json_file, {
            "found": False,
            "hash": target_hash,
            "reason": "No match found",
            "elapsed_seconds": round(time() - start_time, 2)
        }, quiet)
    return False

# ===== ENTRY POINT ===== #
if __name__ == "__main__":
    try:
        args = parse_args()
        configure_logging(args.log)

        if sum(bool(x) for x in [args.target_hash, args.hash_file, args.stdin_mode]) != 1: # PREVENT INVALID COMBINATIONS
            info("❌ ERROR: You must provide exactly one of: --target-hash, --hash-file, or --stdin-mode")
            sys.exit(1)

        algos = get_algorithms(args.algo, args.hash_length)
        wordlists = get_wordlists(args.custom_wordlist)

        targets = []

        if args.hash_file:
            if not os.path.exists(args.hash_file):
                info(f"❌ ERROR: Hash file '{args.hash_file}' not found.")
                sys.exit(1)
            with open(args.hash_file, "r", encoding="utf-8") as f:
                targets = [line.strip() for line in f if line.strip()]
        elif args.stdin_mode:
            if sys.stdin.isatty():
                info("📥 Waiting for input... (press Ctrl+D to end)")
            stdin_data = sys.stdin.read()
            targets = [line.strip() for line in stdin_data.strip().splitlines() if line.strip()]
            if not targets:
                info("❌ ERROR: No hashes provided via stdin.")
                sys.exit(1)
        else:
            targets = [args.target_hash]

        for target_hash in targets: # INFER ALGORITHMS BY HASH-LENGTH IF NOT SPECIFIED
            hash_algos = get_algorithms(args.algo, len(target_hash))
            
            if not hash_algos:
                info(f"⚠️ Skipping '{target_hash}': unsupported length {len(target_hash)}")
                continue

            if not all(c in "0123456789abcdefABCDEF" for c in target_hash):
                info(f"⚠️ Skipping '{target_hash}': not a valid hex string")
                continue

            attack_hash(
                target_hash=target_hash,
                wordlists=wordlists,
                algos=hash_algos,
                mode=args.mode,
                threads=args.threads,
                save_file=args.save_file,
                json_file=args.json,
                quiet=args.quiet
            )

    except KeyboardInterrupt:
        info("🛑 Attack interrupted by the user.", args.quiet)
