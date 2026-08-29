// Resolves BookUnit -> its first real physical page, so links coming from
// Readings/Concepts/Arcs (which only know book_unit, per the canonical
// READINGS v0.3 contract) can point into the corrected paginated reader
// (/libro/p/[n]) instead of the retired /libro/[unit] route.
//
// A BookUnit can span multiple physical pages (see
// docs/web/VISUAL-PROTOTYPE-v0.2.md §2); linking to the FIRST page that
// contains it is the correct "entry point" behaviour — the reader lands
// where that unit begins and can keep reading forward normally.
import { getCollection } from 'astro:content';

export async function getFirstPageByBookUnit(): Promise<Map<number, number>> {
  const pages = (await getCollection('pages')).sort((a, b) => a.data.page - b.data.page);
  const map = new Map<number, number>();
  for (const p of pages) {
    for (const unit of p.data.book_units) {
      if (!map.has(unit)) map.set(unit, p.data.page);
    }
  }
  return map;
}
