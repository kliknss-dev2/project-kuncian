/**
 * generate-ocr-index.mjs
 * Run OCR on all kuncian images and write results to src/generated/ocr-index.json
 * Usage: node scripts/generate-ocr-index.mjs
 */

import { createWorker } from 'tesseract.js';
import { readdir, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.resolve(__dirname, '..');
const KUNCIAN_DIR = path.join(ROOT, 'public', 'content', 'kuncian');
const OUT_FILE    = path.join(ROOT, 'src', 'generated', 'ocr-index.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// ── helpers ────────────────────────────────────────────────
async function collectImages(dir) {
  const images = [];
  const topics = await readdir(dir);

  for (const topic of topics) {
    const topicPath = path.join(dir, topic);
    const info = await stat(topicPath).catch(() => null);
    if (!info?.isDirectory()) continue;

    const files = await readdir(topicPath);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;

      const absPath  = path.join(topicPath, file);
      const relPath  = `${topic}/${file}`;  // relative to kuncian/
      images.push({ topic, file, absPath, relPath });
    }
  }
  return images;
}

function cleanText(raw) {
  return raw
    .replace(/\s+/g, ' ')   // collapse whitespace
    .replace(/[^\w\s.,!?()\-:;]/gu, ' ') // strip weird OCR artifacts
    .trim()
    .toLowerCase();
}

// ── main ───────────────────────────────────────────────────
async function main() {
  console.log('[ocr] Collecting images...');
  const images = await collectImages(KUNCIAN_DIR);
  console.log(`[ocr] Found ${images.length} images across topics.\n`);

  // Load existing index so we can skip already-processed files
  let existing = {};
  if (existsSync(OUT_FILE)) {
    try {
      const raw = await import(OUT_FILE, { assert: { type: 'json' } });
      existing = raw.default ?? {};
      console.log(`[ocr] Loaded ${Object.keys(existing).length} existing entries — skipping unchanged files.\n`);
    } catch { /* fresh start */ }
  }

  const worker = await createWorker('ind+eng', 1, {
    logger: () => {} // silence per-image progress spam
  });

  const index = { ...existing };
  let processed = 0;
  let skipped   = 0;

  for (let i = 0; i < images.length; i++) {
    const { relPath, absPath } = images[i];
    const pct = Math.round(((i + 1) / images.length) * 100);

    // Skip if already indexed (incremental)
    if (existing[relPath] !== undefined) {
      skipped++;
      process.stdout.write(`\r[ocr] ${pct}% (${i + 1}/${images.length}) — ⏭  skipped: ${relPath.slice(0, 60)}`);
      continue;
    }

    process.stdout.write(`\r[ocr] ${pct}% (${i + 1}/${images.length}) — 🔍 ${relPath.slice(0, 60).padEnd(60)}`);

    try {
      const { data } = await worker.recognize(absPath);
      index[relPath] = cleanText(data.text);
      processed++;
    } catch (err) {
      console.error(`\n[ocr] ⚠️  Failed: ${relPath} — ${err.message}`);
      index[relPath] = '';
    }
  }

  await worker.terminate();

  console.log(`\n\n[ocr] Done! Processed: ${processed}, Skipped: ${skipped}`);

  await writeFile(OUT_FILE, JSON.stringify(index, null, 2), 'utf8');
  console.log(`[ocr] Index written to: ${OUT_FILE}`);
  console.log(`[ocr] Total entries: ${Object.keys(index).length}`);
}

main().catch((err) => {
  console.error('[ocr] Fatal error:', err);
  process.exit(1);
});
