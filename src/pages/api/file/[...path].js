import fs from 'node:fs/promises';
import { getMimeType, safeRelativePath } from '../../../lib/library.js';

export async function GET({ params }) {
  const safePath = safeRelativePath(params.path);

  if (!safePath) {
    return new Response('File path tidak valid.', { status: 400 });
  }

  try {
    const stat = await fs.stat(safePath.absolutePath);

    if (!stat.isFile()) {
      return new Response('File tidak ditemukan.', { status: 404 });
    }

    const file = await fs.readFile(safePath.absolutePath);
    const filename = safePath.relativePath.split('/').pop();

    return new Response(file, {
      headers: {
        'Content-Type': getMimeType(filename),
        'Content-Length': String(stat.size),
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch {
    return new Response('File tidak ditemukan.', { status: 404 });
  }
}
