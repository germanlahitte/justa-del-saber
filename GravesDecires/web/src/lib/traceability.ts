// Builds the inverse index book_unit -> reading_ids[] described in
// WEB-EXPERIENCE-v0.1.md §J.2. READINGS only store book_refs[].book_unit
// (Reading -> BookUnit); BOOK must be able to know "a reading exists about
// this unit" WITHOUT loading reading content. This module computes that
// inverse index once, in-memory, from the canonical readings-v0.3.json.
//
// This is read-only derivation: it never writes back to readings-v0.3.json
// or book-model.json.
import { getCollection } from 'astro:content';

export async function getReadingIdsByBookUnit(): Promise<Map<number, string[]>> {
  const readings = await getCollection('readings');
  const index = new Map<number, string[]>();
  for (const reading of readings) {
    for (const ref of reading.data.book_refs) {
      const list = index.get(ref.book_unit) ?? [];
      list.push(reading.id);
      index.set(ref.book_unit, list);
    }
  }
  return index;
}

export async function getConceptIdsByBookUnit(): Promise<Map<number, string[]>> {
  const readings = await getCollection('readings');
  const index = new Map<number, Set<string>>();
  for (const reading of readings) {
    for (const ref of reading.data.book_refs) {
      const set = index.get(ref.book_unit) ?? new Set<string>();
      for (const c of reading.data.concept_ids) set.add(c);
      index.set(ref.book_unit, set);
    }
  }
  const out = new Map<number, string[]>();
  for (const [k, v] of index) out.set(k, [...v]);
  return out;
}
