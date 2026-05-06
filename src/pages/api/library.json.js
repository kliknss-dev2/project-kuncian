import { readLibrary } from '../../lib/library.js';

export async function GET() {
  try {
    const library = await readLibrary();

    return new Response(JSON.stringify(library), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}
