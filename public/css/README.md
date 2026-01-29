# 🧼 custom-reset.css

*Universal CSS reset based on Meyerweb, modernized for real-world usage.*

Fixes cross-browser inconsistencies and provides a clean, accessible foundation for any design system.

---

## 🧠 Features

- Based on Eric Meyer's v2.0 reset – battle-tested since 2011.
- Fully updated for modern HTML5 semantic tags.
- Improved defaults for:
  - Typography & readability
  - Media elements (`img`, `svg`, `video`, `canvas`, etc.)
  - Forms, buttons & links
  - Accessibility (`:focus-visible`, reduced motion)
- Universal `box-sizing: border-box` enforced globally.
- Safe scroll behavior using `prefers-reduced-motion`.

---

## 🛠️ Usage Example

1. IMPORT DIRECTLY FROM REPOSITORY — no need to download:

    ```css
    @import url("https://open-utils-dev-sandokan-cat.vercel.app/css/custom-reset.css");
    ```

    or

    ```html
    <link rel="stylesheet" href="https://open-utils-dev-sandokan-cat.vercel.app/css/custom-reset.css">
    ```

2. OR DOWNLOAD AND IMPORT FROM YOUR OWN PROJECT FOLDER:

    ```css
    @import url("./css/custom-reset.css");
    ```

    or

    ```html
    <link rel="stylesheet" href="css/custom-reset.css">
    ```

> ☝️ This file should be loaded **before** any global styles or component-specific CSS.

---

## 📝 License

*Original reset: Public Domain - [Eric Meyer](http://meyerweb.com/eric/tools/css/reset/)*

**Custom modifications: © 2025 [sandokan.cat](https://sandokan.cat)**

<div align="center">
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
    </a>
</div>

---

## 🧪 Tested On

- Chromium-based browsers (Chrome, Edge)
- Firefox (desktop & mobile)
- Safari (desktop & iOS)
- Legacy fallback support (polyfills optional)

---

## ⚠️ Notes

- This file does not add styling – only normalization.
- Ideal for minimalistic UIs, landing pages, single-page apps, portfolios, and design systems.

> "Reset before you paint."
