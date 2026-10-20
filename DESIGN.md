---
name: kotak.lo
description: Kotak mainan kantor — a pastel, thick-ink, pressable toolbox of small tools.
colors:
  kuning-stabilo: "#f6bd4f"
  biru-postit: "#9bd7e5"
  pink-penghapus: "#f5a6b4"
  ungu-krayon: "#c9b6ea"
  ink: "#222222"
  ink-deep: "#111111"
  paper: "#ffffff"
  cream: "#fffaf0"
  mint: "#eef8f5"
  highlight: "#fff3c4"
  muted-text: "#555555"
  slate-night: "#0f172a"
  slate-surface: "#1e293b"
  slate-abyss: "#020617"
  slate-text: "#f8fafc"
  slate-muted: "#94a3b8"
  success: "#10b981"
  success-soft: "#d1fae5"
  danger: "#b91c1c"
  danger-soft: "#fee2e2"
typography:
  display:
    fontFamily: "Nunito, Arial Rounded MT Bold, Trebuchet MS, sans-serif"
    fontSize: "clamp(3rem, 8vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.08em"
  headline:
    fontFamily: "Nunito, Arial Rounded MT Bold, Trebuchet MS, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Nunito, Trebuchet MS, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 900
    lineHeight: 1.2
  body:
    fontFamily: "Nunito, Trebuchet MS, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 600
    lineHeight: 1.5
  mono:
    fontFamily: "Space Mono, Courier New, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.75
  label:
    fontFamily: "Nunito, Trebuchet MS, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  xs: "7px"
  sm: "9px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  2xl: "18px"
  3xl: "20px"
  pill: "999px"
spacing:
  xs: "0.4rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  2xl: "3rem"
components:
  button-pressable:
    backgroundColor: "{colors.pink-penghapus}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-pressable-blue:
    backgroundColor: "{colors.biru-postit}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-small:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.32em 0.8em"
  button-pill-toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.4em 0.9em"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  input-search-focus:
    backgroundColor: "{colors.highlight}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  card-topic:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "1rem 1.1rem"
  chip-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.3em 0.7em"
  badge-new:
    backgroundColor: "{colors.pink-penghapus}"
    textColor: "{colors.ink-deep}"
    rounded: "4px"
    padding: "2px 6px"
  badge-update:
    backgroundColor: "{colors.biru-postit}"
    textColor: "{colors.ink-deep}"
    rounded: "4px"
    padding: "2px 6px"
---

# Design System: kotak.lo

## Overview

**Creative North Star: "Kotak Mainan Kantor"**

kotak.lo is an office toy box: work tools that look and behave like toys. Every surface is a chunky object outlined in thick ink, filled with flat stationery pastels, and set on warm cream paper sprinkled with a faint dot grid. Things that can be clicked sit on solid, unblurred shadows and physically sink into them when hovered or pressed. The interface should feel like pressing a real button.

The mood is cheerful and playful but never in the way. Emoji, slight rotations on ornaments and casual copy do the joking. Information still has to be readable at a glance, because the person is usually mid-task and on a phone. Layouts are light and roomy, with generous padding inside cards and clear gaps between them. Nothing is crammed.

Confirmed rejections: blurred shadows and glassmorphism, gradients on buttons or cards, sharp (0px) corners, and saturated or neon colour.

**Key Characteristics:**
- Thick ink outlines (2–2.5px `#222`) on every object.
- Solid offset shadows with zero blur that shrink as an element is pressed.
- Four stationery pastels, one per tool, over cream paper.
- Heavy, rounded Nunito (800–900) paired with Space Mono for inputs and data.
- Rounded everything, from 7px buttons to pill toggles.
- Full dark mode in slate, keeping the same outline-and-shadow grammar.

## Colors

A warm-paper base with four soft stationery pastels and a near-black ink that draws every edge.

### Primary
- **Kuning Stabilo** (kuning-stabilo): the house colour. It marks Kuncian.lo, favourite stars, text selection, the hub's light-mode sun icon and topic-card hover tints (12% alpha). It is the accent people associate with kotak.lo.

### Secondary
- **Biru Post-it** (biru-postit): the JSON Formatter's accent, the "Update" badge, "Prev" buttons, OCR result counts and the dot in the kotak.lo logo.
- **Pink Penghapus** (pink-penghapus): the main call to action ("Lihat dokumen", "Next"), the "New" badge and the active compare toggle.

### Tertiary
- **Ungu Krayon** (ungu-krayon): the Lorem Ipsum accent and an ornamental shape in the Kuncian header.

### Neutral
- **Tinta** (ink): every border, every shadow and default text. It is the system's skeleton.
- **Tinta Pekat** (ink-deep): headline text and text on pastel fills.
- **Kertas** (paper): card, button and input fills. Cards may sit at 92% opacity over the dot grid.
- **Krem** (cream): page background, under soft radial pastel washes.
- **Mint** (mint): the soft card variant (sidebar) and idle chips.
- **Sorot** (highlight): focused search-input fill and search-match `<mark>` backgrounds.
- **Teks Redup** (muted-text): taglines and secondary copy on light surfaces. Lighter greys (`#666`, `#888`) are used for panel labels and footers.
- **Dark mode** (slate-night, slate-surface, slate-abyss, slate-text, slate-muted): the page runs from slate-night to slate-abyss, cards sit on slate-surface, and borders and shadows are slate-abyss (`#020617`) on every tool, available in Tailwind as `border-abyss` and `shadow-saw-dark` / `shadow-saw-sm-dark` / `shadow-pressed-dark`. Text is slate-text, and muted text is slate-muted.
- **Status** (success, success-soft, danger, danger-soft): only for JSON valid/invalid dots and badges and destructive actions.

### Named Rules
**The One Tool, One Pastel Rule.** Each tool owns one accent: Kuncian takes Kuning Stabilo, JSON Formatter takes Biru Post-it and Lorem Ipsum takes Ungu Krayon. A tool's emoji tile and hub card tint (18–22% alpha) use its accent. A new tool claims the free pastel (Pink Penghapus) or a new soft pastel of similar lightness. It never gets a saturated colour.

**The Ink Is Structure Rule.** Ink (`#222`) is for outlines, shadows and text, never for large fills. The only dark fills allowed are the small chip-tag and the dark-mode surfaces.

## Typography

**Display Font:** Nunito (with Arial Rounded MT Bold, Trebuchet MS)
**Body Font:** Nunito (with Trebuchet MS)
**Label/Mono Font:** Space Mono (with Courier New)

**Character:** Nunito at black weights is round, friendly and chunky, the typographic equivalent of the thick outlines. Space Mono adds a typewriter-on-the-desk note for anything the user types or counts.

### Hierarchy
- **Display** (900, 3rem → 4.5rem, line-height 1, tracking −0.08em): wordmarks only, such as "kuncian.lo" and "kotak.lo" (the hub logo uses clamp(2rem, 6vw, 3.25rem), −1px).
- **Headline** (900, 1.875rem → 3rem, line-height 1.25, tracking −0.04em): one hero line per page, e.g. "Solusi singkat menuju pulang cepat!".
- **Title** (900, 1.35–1.5rem, line-height 1.1–1.2): tool names on hub cards and tool page headers.
- **Body** (600, 0.83–0.88rem, line-height 1.5): card descriptions and subtitles. The weight never drops below 600, so body text stays chunky.
- **Mono** (700, 0.875–1rem, line-height 1.75): inputs, search fields, stat numbers, pressable buttons, the Kuncian intro paragraph and code (CodeMirror at 0.85rem).
- **Label** (800, 0.72rem, tracking 0.07–0.18em, UPPERCASE): tags, panel headers, stat labels. Status badges shrink this to 9px.

### Named Rules
**The Never-Thin Rule.** No text below weight 600. The thinnest stroke in the system is body copy at 600, and anything structural is 800–900.

## Layout

Single-column, centred containers on a dot-grid paper field. The hub caps at 760px with an auto-fill grid of 300px-minimum cards. It drops to one column below 480px. Kuncian caps at max-w-7xl (80rem) with a three-stat row, a topic grid (2 → 3 → 4 columns) and a sticky sidebar that only appears at lg (1024px) and up. The JSON Formatter is a full-viewport (100vh, max 1400px) three-column editor grid.

Spacing is generous. The page gutter is 1.25rem (16–32px responsive in Kuncian), grid gaps are 0.75–1.5rem, card padding is 1–1.5rem and header-to-content separation is about 3rem. Responsive behaviour uses Tailwind's default breakpoints (sm 640, md 768, lg 1024, xl 1280, 2xl 1536). On mobile, secondary controls move into a bottom bar (the image viewer's Prev/Next).

**The Phone-First Lookup Rule.** Primary search and the topic grid must be usable one-handed at 375px. Desktop-only chrome (the sidebar, the inline viewer controls) is an addition, never the only path.

## Elevation & Depth

Depth is entirely structural. There are no blurred shadows anywhere. A solid, zero-blur, bottom-right offset shadow in ink says "this is an object you can touch". Interaction is shown by the object sliding toward its shadow (translate 1–3px) while the shadow shrinks by the same amount, so it reads as being pressed into the page. The page itself is flat paper, made a little warmer by soft radial pastel washes and the dot grid.

### Shadow Vocabulary
- **Lifted** (`box-shadow: 8px 8px 0 #222`): main cards, hub app cards, `.saw-card`.
- **Panel** (`box-shadow: 7px 7px 0 #222`): JSON editor panels.
- **Raised** (`box-shadow: 5–6px 5–6px 0 #222`): topic cards, pressable buttons.
- **Resting** (`box-shadow: 4px 4px 0 #222`): inputs, emoji tiles, compare bar.
- **Low** (`box-shadow: 3px 3px 0 #222`): small buttons, active tabs, pill toggles.
- **Pressed** (`box-shadow: 1–3px 1–3px 0 #222`): the hover/press state of any of the above.
- **Dark mode**: same offsets, shadow colour `#020617` (Tailwind `shadow-*-dark`).

### Named Rules
**The Shadow Means Clickable Rule.** A solid offset shadow is a promise that the element responds to touch. Static containers that aren't interactive (stat tiles, the sidebar) may carry one only as the large "Lifted" frame. Every interactive element must also have the pressed state.

**The Press Physics Rule.** On hover/press, translate by (start offset − end offset) on both axes over 110–160ms `ease`, so the element lands exactly where its shadow was.

## Shapes

Everything is rounded and outlined. Radii scale with object size: 7px for tiny action buttons, 9–10px for buttons, 14px for inputs and emoji tiles, 16–20px for cards and panels, about 2rem for page-level sections, and pills (999px) for toggles, tags and counters. Borders are 2px ink, and 2.5px on the biggest objects (hub cards, JSON panels). Ornamental shapes (the Kuncian header's circle, blob and rounded square) are tilted −10° to +12°.

## Components

### Buttons
Squishy, firm and pressable.
- **Shape:** gently rounded (9–10px), 2px ink outline.
- **Pressable (primary):** a pastel fill (Pink Penghapus for forward/primary, Biru Post-it for back/previous), ink-deep Space Mono at 700, a 5–6px "Raised" shadow and 12×20px padding.
- **Small / back:** a paper fill with Nunito 800 at 0.82rem, padding 0.32em × 0.8em and a 3px shadow. It is used for "← Kembali" links and panel actions (7px radius, 2px shadow).
- **Pill toggle:** a 999px radius with a 3px shadow, used for the dark-mode toggle.
- **Hover / Press:** see the Press Physics Rule. Disabled buttons drop to 35–40% opacity with a `not-allowed` cursor.
- **Danger:** text, border and shadow all turn `#b91c1c`.
- **Focus:** every focusable element gets a global `:focus-visible` ring (`3px solid #222`, offset 3px; Kuning Stabilo `#f6bd4f` in dark mode), defined in `global.css`. Where a scrolling or `overflow:hidden` parent would clip it (JSON tabs, sidebar topics, the Lorem stepper), the ring is drawn inset with a negative offset.

### Chips & Badges
- **Tag chip:** an ink fill, paper text, uppercase label type and pill shape (e.g. "BELAJAR", "DEV TOOL").
- **Status badges:** 9px uppercase bold, 1px ink border, 4px radius. "New" uses Pink Penghapus and "Update" uses Biru Post-it.
- **Counter pill:** Biru Post-it with a 2px ink border and mono text (e.g. "12 hasil"). When idle it switches to Mint with a soft grey border.

### Cards / Containers
- **Corner Style:** 16px for topic cards, 18px for `.saw-card` and panels, 20px for hub app cards.
- **Background:** paper (92% opacity over dots) or Mint for the soft variant. Hub app cards are tinted with their tool's accent at 18–22% alpha.
- **Shadow Strategy:** Lifted (8px) for frames and Raised (5px) for clickable topic cards, with the press state on hover plus a 12% Kuning Stabilo wash.
- **Border:** 2–2.5px ink.
- **Internal Padding:** 1rem–1.5rem.

### Inputs / Fields
- **Style:** a paper fill, 2px ink outline, 14px radius, 4px "Resting" shadow and Space Mono 700 text.
- **Focus:** the fill turns Sorot (`#fff3c4`) instead of showing a focus ring. In dark mode it shifts to slate-600.
- **Size on phones:** inputs are 16px below 640px (14px from sm up), so iOS Safari doesn't zoom in when one is tapped.
- **Inline search bar:** a rounded-xl strip in `#fffdf8` with a leading search icon and a trailing counter pill.

### Navigation
There is no global nav bar. kotak.lo is a hub and spokes. Each tool page opens with the shared `.saw-back-btn` "← Kembali" link (top-left, defined once in `global.css`), and the hub's top-right holds the pill dark-mode toggle. Inside Kuncian, the active topic lives in the URL, with a sticky topic sidebar on desktop and back-to-picker on mobile. In topic view, the hero shrinks to the wordmark only and the topic name becomes the page's h1, so the answers start near the top on a phone.

### Hub App Card (signature)
The tile that represents a tool in the hub. It has a 20px radius, a 2.5px ink border, an 8px shadow and a fill tinted with the tool's accent. A 52px white emoji tile with a 14px radius and 4px shadow sits top-left, with an ink tag chip top-right. Below come the title, the description and a small white "Buka aplikasi →" button. On hover the whole card presses 3px into its shadow and the inner button presses 1px. Every new tool gets one of these.

## Do's and Don'ts

### Do:
- **Do** outline every object in 2px `#222` ink, or 2.5px on the largest cards.
- **Do** use solid zero-blur offset shadows (8 / 5 / 3px) on interactive elements, and press them on hover by translating exactly as far as the shadow shrinks.
- **Do** give each tool one stationery pastel and reuse it for its emoji tile and hub card tint.
- **Do** set headings in Nunito 900 and anything typed or counted in Space Mono.
- **Do** add a `dark:` / `html.dark` variant for every coloured surface, border and shadow (slate surfaces, near-black outlines).
- **Do** keep copy casual Indonesian with emoji where it fits the voice.

### Don't:
- **Don't** use blurred shadows, glows or glassmorphism / backdrop blur.
- **Don't** put gradients on buttons, cards or inputs. Gradients belong only to the page background washes.
- **Don't** use sharp 0px corners. The smallest radius is 4px (status badges).
- **Don't** introduce saturated or neon colours. New accents must match the existing pastels in lightness (≈ oklch 80–85%).
- **Don't** set text thinner than weight 600.
- **Don't** use ink as a large fill colour.
