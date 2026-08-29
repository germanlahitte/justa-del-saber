// Serves the ORIGINAL extracted assets (assets/docx-media/*) byte-for-byte.
// No recompression, no resizing, no format conversion — this endpoint reads
// the exact bytes extracted in Stage 1 (tools/extract_assets.py) and streams
// them back with the correct content type. This keeps a single copy of the
// canonical assets in the repo (../assets/docx-media) instead of duplicating
// them into web/public, which would create two "originals" and break
// traceability to sha256 recorded in data/extraction-log.json.
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const ASSET_DIR = path.resolve(process.cwd(), '../assets/docx-media');

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export const GET: APIRoute = async ({ params }) => {
  const file = params.file;
  if (!file || file.includes('..') || file.includes('/')) {
    return new Response('Not found', { status: 404 });
  }
  const ext = path.extname(file).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response('Unsupported asset type', { status: 415 });
  }
  const filePath = path.join(ASSET_DIR, file);
  try {
    const bytes = fs.readFileSync(filePath);
    return new Response(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};

export function getStaticPaths() {
  const files = fs.readdirSync(ASSET_DIR);
  return files.map((file) => ({ params: { file } }));
}
