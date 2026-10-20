# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**kotak.lo** is a small multi-tool web app (Astro 5 + Vue 3, SSR on Netlify). It has a hub page (`/`) and three tools: Kuncian Viewer (`/kuncian`), JSON Formatter (`/json-formatter`) and Lorem Ipsum Generator (`/lorem-ipsum`). UI copy, comments and commit-facing content are mostly in Indonesian. Keep new UI text in Indonesian too.

## Commands

```bash
npm install
npm run dev        # astro dev at http://localhost:4321
npm run build      # generate-topic-meta.mjs, then astro build
npm run preview
npm run ocr        # incremental OCR of kuncian images -> src/generated/ocr-index.json
```

There are no tests, linter or formatter configured.

On a fresh clone, run `node scripts/generate-topic-meta.mjs` once before `npm run dev`. `src/lib/library.js` imports `src/generated/topic-meta.json`, which is gitignored, so dev fails until that file exists.

## Architecture

### Kuncian content pipeline (the core of the repo)
- Content lives in `public/content/kuncian/<Topic Name>/`. Each topic is one folder of screenshots (`Tangkapan Layar ….png`) and usually one source PDF/PPTX. You add a topic by adding a folder; there is no registry to edit.
- `src/lib/library.js` `readLibrary()` scans those folders at request time and sorts them with the `id-ID` collator. `/api/library.json` serves the result. Files are classified as `image` or `document` by extension.
- Topic `createdAtMs`/`updatedAtMs` come from **git history**, not the filesystem. `scripts/generate-topic-meta.mjs` runs `git log` per folder at build time, which is why `netlify.toml` sets `GIT_DEPTH = "0"`. The viewer derives its "new" and "updated" badges from these timestamps (3-day window). A topic only gets correct dates once it has been committed.
- Image text search uses `src/generated/ocr-index.json`. It maps `"Topic/filename.png"` to lowercased OCR text and is imported directly into `KuncianViewer.vue`. This file **is committed** (an exception in `.gitignore`). After you add or change images, run `npm run ocr` and commit the updated index. The `chore(ocr): update ocr index for new kuncian folder` commits follow this pattern. OCR is incremental: entries whose keys already exist are skipped, so you have to delete an entry to re-OCR its image. Tesseract uses `ind+eng`. The `*.traineddata` files in the root are gitignored.
- The viewer loads files through their static `/content/kuncian/...` URLs (`file.url`). `src/pages/api/file/[...path].js` is an alternate streaming endpoint, guarded by `safeRelativePath()`.

### Frontend
- Each Astro page in `src/pages/` is a thin wrapper around one Vue component in `src/components/`. `KuncianViewer` and `AppHub` use `client:load`. `JsonFormatter` and `LoremGenerator` must stay `client:only="vue"` because CodeMirror crashes under SSR.
- `BaseLayout.astro` enables View Transitions and applies dark mode before first paint from `localStorage.kotak_theme`. It re-applies the theme on `astro:after-swap`. Any new page must use `BaseLayout` so theming keeps working.
- KuncianViewer state: the active topic is held in the `?q=<topic name>` query param (pushState/popState). Favorites are stored in `localStorage.kuncian_favorites`.
- Styling uses Tailwind (`darkMode: 'class'`, custom `shadow-saw` / `shadow-saw-sm` / `shadow-pressed`, and the `display` / `body` / `monoish` font families) together with scoped `<style>` blocks in components and CSS variables and "saw-*" utility classes in `src/styles/global.css`. The visual style is neo-brutalist: 2px `#222` borders, offset hard shadows and a cream background. Each element also needs `dark:` variants.
