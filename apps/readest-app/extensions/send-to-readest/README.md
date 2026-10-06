# Send to Yomi — browser extension

One-click capture of the current web page into your Yomi library as a
**self-contained EPUB**. Built for Chromium-based browsers (Chrome, Edge,
Arc, Brave). Manifest V3.

## What it captures

For every page the user clips, the extension produces a single `.epub`:

- Article body via [@mozilla/readability](https://github.com/mozilla/readability)
  on the live, fully-rendered DOM — so paywalled / authenticated pages
  capture the content the user can actually see.
- Lazy-loaded images surfaced by walking the DOM and resolving `srcset`,
  `<picture>`/`<source>`, `data-src`, `data-original`, `data-srcset`,
  `data-lazy`, and `data-actualsrc` in that order of preference (the same
  set the server-side bundler in `src/services/send/conversion/assetBundler.ts`
  handles).
- Image bytes fetched by the **service worker** under the user's existing
  session (`credentials: 'include'`) and the extension's broad
  `host_permissions: ["<all_urls>"]` — CORS doesn't apply, paywalled CDN
  cookies do.
- A small bundled stylesheet (system fonts only — no remote fonts), so the
  EPUB never makes a network request when opened offline.
- Inline images stored under `OEBPS/images/<sha256>.<ext>`, deduplicated by
  hash so a hero shared between `<picture>` and `<img>` only ships once.

The EPUB is POSTed to **`POST /api/send/inbox/file`** with `kind=file`. The
server writes the bytes to R2 and inserts a `send_inbox` row; the next
Yomi client to open drains the inbox and imports the EPUB as-is — no
further server-side conversion.

### Locally opened pages (`file://`)

A saved web page, an exported HTML report, a loose `.xhtml` chapter — if
the user can open it in a tab, the extension clips it through the exact
same converter. Three things differ:

- **Chrome requires "Allow access to file URLs"** on the extension's own
  row in `chrome://extensions`; `host_permissions` alone does not grant it.
  The popup checks `chrome.extension.isAllowedFileSchemeAccess()` first and
  offers a button straight to that page, because without the toggle the
  capture-script inject dies with an opaque host-permission error.
- **Images survive, including local siblings.** An extension page holding
  file access *can* read `file://` URLs (a content script in the page
  cannot, and the rendered `<img>` taints a canvas, so the bundler is the
  only route). A "Save Page As, Complete" therefore keeps its
  `<name>_files/` images, a single-file save keeps its inlined `data:`
  images, and an HTML-only save keeps whatever it still points at on the
  original CDN.

  Reading local files is fenced twice, because the EPUB we build is
  uploaded: the clipped page must itself be `file://` (so a remote page
  pointing an `<img>` at the disk reads nothing), and the asset must sit
  under that page's own directory (so a crafted local page can't harvest
  the rest of the disk). A page at the filesystem root gets nothing.
- **The source URL never leaves the machine.** `X-Readest-Url` is sent only
  for `http(s)` pages — the inbox endpoint rejects anything else anyway, and
  an absolute path out of someone's home directory isn't ours to upload. The
  file name stands in for the site name on the generated cover and, when the
  page declares no `<title>`, as the book title.

## Why client-side conversion

The previous version (`0.1.0`) sent only the page URL — the server then
tried to fetch and render it. That broke on:

- Paywalled / member-only content (server doesn't have the user's cookies).
- Bot-protected CDNs (Cloudflare, image hosts that gate on UA + Sec-Ch-Ua
  headers + JS challenges).
- Lazy-loaded images that never materialize without a real scroll.

Building the EPUB on the capturing client side-steps all three.

## Architecture

```
popup (popup.ts)
   │  click "Send to Yomi"
   ▼
service worker (background/service-worker.ts)
   │  chrome.scripting.executeScript({ files: ['content/capture.js'] })
   ▼
content script (content/capture.ts)  [runs in the page's tab]
   ├─ scrolls page once to materialize lazy images
   ├─ flattens open Shadow DOM (content/capture/shadow.ts)
   ├─ Readability extracts article body
   ├─ walks <img>/<picture>, rewrites src → placeholder tokens
   ├─ DOMPurify-sanitizes the article HTML
   └─ returns { meta, articleHtml, images:[{placeholder,url}] }
   ▼
service worker
   ├─ fetchAssets(images) — CORS-free, credentialed image downloads
   ├─ buildEpub — zip.js: mimetype, container, OPF, NCX, CSS, chapter, images
   └─ uploadEpub — POST /api/send/inbox/file with EPUB bytes
   ▼
server (src/pages/api/send/inbox/file.ts)
   ├─ putObject → R2 (inbox bucket, kind='file')
   └─ insert send_inbox row
   ▼
next Yomi open → drainer imports the EPUB → book in library on all devices
```

A second always-on content script (`content/auth-bridge.ts`) runs on
`biblophile.com` and copies the user's Supabase access token into the
extension's `chrome.storage.local` so the popup can authenticate to the
inbox endpoint without prompting for credentials. The extension never
stores a password or refresh token.

## Build

```bash
# From the extension directory:
npm run build   # produces dist/ ready to load unpacked (or: pnpm build)
npm run dev     # watch mode while developing
npm run zip     # builds & packages send-to-yomi-<version>.zip for the Chrome Web Store
```

The build is webpack-based:

- `src/background/service-worker.ts` → `dist/background/service-worker.js`
  (bundles `@zip.js/zip.js`)
- `src/content/capture.ts` → `dist/content/capture.js`
  (bundles `@mozilla/readability` + `dompurify`)
- `src/content/auth-bridge.ts` → `dist/content/auth-bridge.js`
- `src/popup/popup.ts` → `dist/popup/popup.js`

`manifest.json`, `popup.html`, and `icons/*` are copied verbatim into
`dist/` by `copy-webpack-plugin`.

## Load it for development

1. `pnpm build` (or `pnpm dev` for watch mode).
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select this directory's `dist/` folder (not the
   project root).
4. Visit <https://biblophile.com/yomi/auth> once and sign in so the auth-bridge
   content script captures the access token.
5. Click the extension's toolbar icon on any article page. The popup
   reflects each phase: capturing → fetching images → building EPUB →
   sending.

### Pointing the extension at a local Yomi

The extension reads `chrome.storage.local.readestApiBase` if set, falling
back to `https://biblophile.com/yomi`. From the DevTools console of the
extension's background page:

```js
chrome.storage.local.set({ readestApiBase: 'http://localhost:3000' });
```

## Testing

Vitest exercises the extension's shell — upload (`X-Readest-*` headers, RFC
5987 encoding, error-code mapping, endpoint override), auth bridge
(`sb-*-auth-token` localStorage → `chrome.storage.local` sync, including
malformed JSON + storage-event rotation), `chrome.storage` auth helpers,
toolbar badge updates, the lazy-load scroll dance (incl.
`prefers-reduced-motion`), and the popup UI rendering for every progress
phase. From the `apps/readest-app` workspace root:

```bash
pnpm test:extension      # shell tests
pnpm build-browser-ext   # production webpack build
pnpm test                # full suite
```

## Internationalisation

The extension uses **key-as-content** i18n: the English source string IS the
lookup key. Import as `_` at every call site to mirror the main repo:

```ts
import { translate as _ } from '../lib/i18n';

_('Send to Yomi');
_('Sent — {count} images could not be fetched.', { count });
```

Two parallel translation surfaces:

| Folder | Scope | When it's read |
|---|---|---|
| `src/locales/<lang>.json` | Runtime UI strings — popup, errors, status, badges. `{ "<english source>": "<translation>" }`. | At runtime by the `_(...)` helper. Falls through to the English key when an entry is missing or set to the `__STRING_NOT_TRANSLATED__` sentinel. |
| `_locales/<lang>/messages.json` | Three manifest fields — `app_name`, `app_description`, `action_title` — referenced as `__MSG_*__` in `manifest.json`. | At install time + by the Chrome Web Store listing. Chrome falls back to `default_locale` (en) automatically, so a locale file is only needed when you want to override the toolbar tooltip / store copy. |

### Extracting strings

After adding `_('...')` calls or `data-i18n="..."` attrs:

```bash
pnpm i18n:extract           # populates every src/locales/*.json with new keys
pnpm i18n:check              # exits non-zero if any bundle has untranslated entries
```

## Packaging for the Chrome Web Store

To build and package the upload-ready `.zip` file for the Chrome Web Store Developer Dashboard:

```bash
# Navigate to the extension directory:
cd apps/readest-app/extensions/send-to-readest

# Build production bundle and generate the zip:
npm run zip
```

This compiles the code into `dist/` and creates:
```
send-to-yomi-<version>.zip  (e.g., send-to-yomi-0.2.1.zip)
```

The resulting zip archive:
- Places `manifest.json` directly at the root (as required by the Chrome Web Store).
- Strips out macOS `.DS_Store` noise and extra `.LICENSE.txt` files.
- Includes pre-rendered icons, service worker, and 34 language bundles.

All developer console answers, single-purpose explanations, and permission justifications are prepared in [`STORE-SUBMISSION.md`](./STORE-SUBMISSION.md).

## Before publishing to the Chrome Web Store

1. Run `npm run zip` to generate the latest `send-to-yomi-<version>.zip`.
2. Ensure you have at least one store screenshot (1280×800 or 640×400).
3. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Click **+ New Item**, upload `send-to-yomi-<version>.zip`, and copy-paste the metadata from `STORE-SUBMISSION.md`.
