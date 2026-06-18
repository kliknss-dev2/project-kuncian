import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KUNCIAN_DIR = path.join(ROOT_DIR, 'public', 'content', 'kuncian');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'generated', 'topic-meta.json');

function gitTimestamp(gitPath, oldest = false) {
  try {
    const flag = oldest ? '--reverse' : '-1';
    const out = execSync(`git log ${flag} --format="%at" -- "${gitPath}"`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    }).trim();
    const first = out.split('\n').find(Boolean);
    return first ? parseInt(first, 10) * 1000 : null;
  } catch {
    return null;
  }
}

const entries = await fs.readdir(KUNCIAN_DIR, { withFileTypes: true });
const meta = {};

for (const entry of entries) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

  const gitPath = `public/content/kuncian/${entry.name}`;
  meta[entry.name] = {
    createdAtMs: gitTimestamp(gitPath, true),
    updatedAtMs: gitTimestamp(gitPath, false)
  };
}

await fs.writeFile(OUTPUT_FILE, JSON.stringify(meta, null, 2));
console.log(`[topic-meta] Generated ${Object.keys(meta).length} topics → src/generated/topic-meta.json`);
