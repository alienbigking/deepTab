# Deep Tab

Deep Tab is a Chrome new tab extension focused on a polished daily start page. It brings together search, app shortcuts, categories, wallpapers, widgets, theme settings, backup/restore, and other personalization controls.

## Requirements

- Node.js 18 is recommended.
- Chrome or another Chromium-based browser that supports Manifest V3.

## Development

```bash
npm install
npm run build
```

For iterative development:

```bash
npm run dev
```

The built extension is emitted to `dist/`. Load that folder from `chrome://extensions/` with Developer Mode enabled.

## Product Scope

The current product direction is a browser new tab page, not the previous auto-refresh utility. The active new tab entry is `newtab.html`, rendered by `newtab.tsx` and `src/pages/main.tsx`.

Core areas:

- Search bar with built-in and custom search engines.
- App grid with folders, drag sorting, categories, and dock pins.
- Wallpaper, theme, and general display settings.
- Widgets, backup/restore, reset settings, and about pages.
- Local-first storage through `chrome.storage.local`.

## Build Output

```bash
npm run build
```

The production bundle writes:

- `dist/newtab.html` and `dist/newtab.js`
- `dist/popup.html` and `dist/popup.js`
- `dist/extension/background/index.js`
- copied assets and `manifest.json`

## Notes

- Keep the service worker small unless a feature genuinely needs background execution.
- Prefer local storage APIs for user configuration.
- Avoid reintroducing auto-refresh timer behavior into the Deep Tab runtime.
