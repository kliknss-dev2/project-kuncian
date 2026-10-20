# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily the owner, using it as a personal toolbox. Kuncian.lo is occasionally shared with a few friends via link. The core recurring situation: a "kuncian" (a mandatory internal policy/SOP quiz that must be cleared) appears during the workday, and the user opens kuncian.lo — often on a phone — to find the matching answer screenshot fast and get back to work (or home).

## Product Purpose

**kotak.lo** is a hub of small, single-purpose tools that keeps growing; kotak.lo itself is the product, and each tool is one tile in it. Current tools:

- **Kuncian.lo** — answer-key viewer: browse topics, search topic names and the OCR'd text inside answer screenshots, zoom/download images, open source documents.
- **JSON Formatter** — format/minify/validate, CodeMirror editor, multi-tab, compare (diff) mode.
- **Lorem Ipsum Generator** — placeholder text by words, sentences, or paragraphs.

Success means getting to the needed result (the right answer, the formatted JSON, the text) in as few steps as possible.

## Positioning

A personal, zero-friction toolbox: no account, no setup, link opens straight to the tool. Kuncian.lo's distinguishing mechanism is full-text search over the content of answer screenshots (OCR index), not just topic names.

## Operating Context

- Used in the middle of work, frequently from a phone; speed to answer matters more than browsing.
- Kuncian content is added by dropping a new topic folder into `public/content/kuncian/`, running OCR, and committing; topics are mostly internal HR/GA policy, SOP, and Juklak/JKL material (Indonesian).
- Deployed on Netlify (Astro SSR); topic "new"/"updated" status comes from git history.

## Capabilities and Constraints

- No login or accounts — anyone with the link can use every tool. Keep it that way.
- Must work comfortably on mobile.
- Per-browser state only (`localStorage`: theme, kuncian favorites, JSON tabs); no server-side user data.
- Dark mode is a supported, persisted preference across all tools.
- New tools are expected; the hub must accommodate more tiles over time. Which tools come next is undecided.

## Brand Commitments

- Names are fixed: **kotak.lo** (hub) and **kuncian.lo** (viewer); the `.lo` suffix is part of the identity.
- Voice: casual, playful Indonesian with emoji in copy (e.g. "Solusi singkat menuju pulang cepat!", "Kerjaan banyak? Mau pulang cepat, tapi ada kuncian? Tenang... kini hadir kuncian.lo! 😎"). All UI copy stays in Indonesian.

## Evidence on Hand

- Kuncian topics and their screenshots/source documents: `public/content/kuncian/` (~40 topics).
- OCR text index: `src/generated/ocr-index.json`.
- No testimonials, usage metrics, or user research exist; do not fabricate any.

## Product Principles

1. Fastest path to the answer wins — search and direct access over browsing.
2. Zero friction: no accounts, no onboarding, the link is the entry point.
3. Each tool does one job well; the hub stays a simple launcher as it grows.
4. Phone-first usability for in-the-moment lookups.
5. Keep the casual, playful Indonesian voice.
