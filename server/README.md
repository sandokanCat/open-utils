# 🧰 CSP Reporting Utilities (Server-side)

Reusable backend tools for handling Content Security Policy (CSP) violation reports, with optional `.htaccess` hardening for extra protection.

---

## 📄 `csp-collector.php`

A minimal PHP endpoint to receive and log CSP (Content Security Policy) violation reports.

### ✅ Features

- 🔐 Blocks any non-`POST` HTTP method
- ✅ Validates and decodes incoming JSON
- 🧠 Captures full client context (IP, hostname, user-agent, etc.)
- 💾 Saves each report as a JSON line (`.jsonl`) in a persistent log file
- 📦 Automatically creates the `/logs` folder if it doesn’t exist

### 📂 Output

Each entry is stored at: `/logs/csp.jsonl`

Format: newline-delimited JSON (NDJSON), ready for CLI parsing or automation tools.

```json
// Example entry in /logs/csp.jsonl
{
  "timestamp": "2025-07-27 18:43:21",
  "ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0 ...",
  "document_uri": "https://example.com/",
  "blocked_uri": "inline",
  "violated_directive": "script-src",
  ...
}
```

### ⚙️ Requirements

- Apache with mod_headers enabled (for `.htaccess` headers)
- PHP 7.4+ (8.0+ recommended)
- Write permission in the `/logs` directory

---

## 🔒 `.htaccess` hardening (optional)

It is recommended to use an `.htaccess` file for basic access control and server-side security enhancements.

---

### 🛡️ Minimal example:

```apache
# BLOCK NON-POST METHODS
<LimitExcept POST>
    Order Allow,Deny
    Deny from all
</LimitExcept>

# PREVENT DIRECTORY LISTING
Options -Indexes

# MIME TYPE SECURITY
AddType application/json .jsonl
AddType text/plain .log

# BASIC SECURITY HEADERS
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set Referrer-Policy "no-referrer"
Header set Permissions-Policy "clipboard-read=(), clipboard-write=()"

# NOTE: 'report-uri' is deprecated in favor of 'report-to', but still widely supported
# Set this header from your server or app configuration:
# Content-Security-Policy: default-src 'self'; report-uri /server/csp-collector.php
```

### 🚀 How to use

1. Upload csp-collector.php to your server
2. Point your CSP policy to this endpoint:

```apache
Content-Security-Policy: default-src 'self'; report-uri /server/csp-collector.php
```

3. Make sure the `/logs` folder exists or let the script create it automatically

---

## 💡 Why it matters

Collecting CSP violation reports helps you:

- Monitor real-world CSP breaks in browsers
- Improve your policy iteratively based on real data
- Detect potential attacks (inline scripts, eval, third-party injections)

## 🔐 Recommendations

- Rotate or purge the `/logs` content periodically (cronjob or logrotate)
- Don’t expose the endpoint unless you're actively using CSP report-uri
- For sensitive environments, protect `/server` with HTTP auth or token validation

## 📁 Directory structure

```pgsql
/server
├── csp-collector.php      # CSP REPORT HANDLER SCRIPT
├── .htaccess              # OPTIONAL SECURITY CONFIGURATION
└── /logs                  # GENERATED LOG FILES (autocreated if missing)
```

> Let me know if you want a short example CSP report in JSON or want to include a quick bash script to tail or analyze the logs.