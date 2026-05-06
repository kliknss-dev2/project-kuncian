import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const KUNCIAN_DIR = path.join(ROOT_DIR, 'public', 'content', 'kuncian');
const KUNCIAN_PUBLIC_BASE = '/content/kuncian';

const PROJECT_DIRS = new Set([
  '.astro',
  '.git',
  '.idea',
  'dist',
  'node_modules',
  'public',
  'src'
]);

const PROJECT_FILES = new Set([
  '.DS_Store',
  '.gitignore',
  'astro.config.mjs',
  'package-lock.json',
  'package.json',
  'postcss.config.mjs',
  'README.md',
  'tailwind.config.mjs'
]);

const IMAGE_EXTENSIONS = new Set(['.apng', '.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const DOCUMENT_EXTENSIONS = new Set(['.csv', '.doc', '.docx', '.key', '.numbers', '.pages', '.pdf', '.ppt', '.pptx', '.txt', '.xls', '.xlsx']);

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.csv': 'text/csv; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.key': 'application/vnd.apple.keynote',
  '.numbers': 'application/vnd.apple.numbers',
  '.pages': 'application/vnd.apple.pages',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const collator = new Intl.Collator('id-ID', {
  numeric: true,
  sensitivity: 'base'
});

function encodePublicPathSegment(segment) {
  return encodeURI(segment)
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F');
}

export function getRootDir() {
  return ROOT_DIR;
}

export function getKuncianDir() {
  return KUNCIAN_DIR;
}

export function getPublicFileUrl(relativePath) {
  return `${KUNCIAN_PUBLIC_BASE}/${relativePath.split('/').map(encodePublicPathSegment).join('/')}`;
}

export function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return 'document';
  }

  return 'other';
}

export function getMimeType(filename) {
  return MIME_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';
}

export function sortByName(a, b) {
  return collator.compare(a.name, b.name);
}

export function safeRelativePath(relativePath) {
  const decoded = decodeURIComponent(relativePath || '');
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.resolve(KUNCIAN_DIR, normalized);

  if (!absolutePath.startsWith(KUNCIAN_DIR + path.sep)) {
    return null;
  }

  return {
    relativePath: normalized,
    absolutePath
  };
}

export async function readLibrary() {
  const entries = await fs.readdir(KUNCIAN_DIR, { withFileTypes: true });
  const topics = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || PROJECT_DIRS.has(entry.name)) {
      continue;
    }

    const topicPath = path.join(KUNCIAN_DIR, entry.name);
    const topicFiles = await fs.readdir(topicPath, { withFileTypes: true });
    const files = [];

    for (const file of topicFiles) {
      if (!file.isFile() || file.name.startsWith('.') || PROJECT_FILES.has(file.name)) {
        continue;
      }

      const type = getFileType(file.name);
      const relativePath = path.join(entry.name, file.name);

      files.push({
        name: file.name,
        topic: entry.name,
        path: relativePath.split(path.sep).join('/'),
        url: getPublicFileUrl(relativePath.split(path.sep).join('/')),
        type,
        extension: path.extname(file.name).replace('.', '').toUpperCase() || 'FILE'
      });
    }

    files.sort(sortByName);

    topics.push({
      name: entry.name,
      images: files.filter((file) => file.type === 'image').length,
      documents: files.filter((file) => file.type === 'document').length,
      total: files.length,
      files
    });
  }

  topics.sort(sortByName);

  return {
    generatedAt: new Date().toISOString(),
    rootName: path.relative(ROOT_DIR, KUNCIAN_DIR),
    totalTopics: topics.length,
    totalFiles: topics.reduce((sum, topic) => sum + topic.total, 0),
    topics
  };
}
