// Reads the top-level, non-list fields of MASTER MAP v0.2 that don't fit a
// Content Collection shape (core_thesis, terminal_structure, band_meta_axis
// order). These are read once at build time straight from the canonical
// JSON — never duplicated or rewritten.
import fs from 'node:fs';
import path from 'node:path';

const MASTER_MAP_PATH = path.resolve(
  process.cwd(),
  '../content/maps/master-map-v0.2.json',
);

interface MasterMapRaw {
  version: string;
  core_thesis: string;
  terminal_structure: {
    sequence: string[];
    meaning: string;
  };
}

let cached: MasterMapRaw | null = null;

export function getMasterMapMeta(): MasterMapRaw {
  if (!cached) {
    const raw = fs.readFileSync(MASTER_MAP_PATH, 'utf-8');
    cached = JSON.parse(raw) as MasterMapRaw;
  }
  return cached;
}
