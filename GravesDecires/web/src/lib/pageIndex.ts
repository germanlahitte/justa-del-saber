// Derives the combined /libro index as an EDITORIAL SELECTION over the BOOK
// structure. A BOOK heading is NOT automatically an index entry: the index
// reflects an explicit editorial policy (data/editorial/book-index.json) on
// top of the headings the `pages` collection (data/page-model.json) yields.
//
// STRUCTURAL NORMALIZATION (stays here): a title that is visually multi-line
// in the DOCX is authored as SEVERAL consecutive <w:p> paragraphs, each
// carrying the same heading style (Title/Heading1/Heading2) — Word wraps
// long headings across paragraphs rather than using a single paragraph with
// soft line breaks. Naively emitting one TOC entry per heading-styled
// paragraph fragments a single semantic title into several index rows.
//
// FIX RULE (purely structural, no manual overrides, no book-index.json
// exceptions): consecutive heading-styled paragraphs (by raw DOCX paragraph
// index, i.e. no paragraph of any kind in between) that land on the SAME
// physical page are ONE semantic heading. They are merged into a single
// TocEntry whose text is the concatenation of all fragments (in order) and
// whose page is the page they all share. This was verified against all real
// multi-paragraph heading runs in the current DOCX (book title, "Mis años…",
// "Enajenación/Individualismo", "Domesticación + epígrafe", "Destrucción
// del entramado social + 'El Vaciamiento'", "Los Nadies + epígrafe",
// "Desarrollo de la subjetividad / La libertad individual", "La libertad de
// todos + epígrafe", "Si me ves volver…") — every one of them is a run of
// same-page consecutive heading paragraphs, and merging them produces
// exactly one navigable entry per section, never fragmented, never duplicated
// to the same destination page. This run-merge is structural normalization
// and intentionally lives here, NOT in the policy file.
//
// CURATION POLICY (data/editorial/book-index.json) is consumed here, not
// reimplemented: `source` is DERIVED from the policy operation — `add`
// produces EDITORIAL rows, `rename`/`merge` re-label (source BOOK). The policy
// file carries the auditable operations and labels; pageIndex applies them
// deterministically on top of the normalized BOOK entries. A subtitle excluded
// by `suppress_subtitle` never appears as an independent index row.
import { getCollection } from 'astro:content';

export interface TocEntry {
  page: number;
  text: string;
  style: string;
  source: 'BOOK' | 'EDITORIAL';
}

interface HeadingBlock {
  page: number;
  docxIndex: number;
  style: string;
  text: string;
}

/** Merge consecutive (by raw DOCX paragraph index) heading blocks that
 * land on the same physical page into single semantic entries. */
function mergeHeadingRuns(blocks: HeadingBlock[]): TocEntry[] {
  const sorted = [...blocks].sort((a, b) => a.docxIndex - b.docxIndex);
  const entries: TocEntry[] = [];
  let run: HeadingBlock[] = [];

  const flush = () => {
    if (run.length === 0) return;
    entries.push({
      page: run[0].page,
      text: run.map((b) => b.text.trim()).join(' ').replace(/\s+/g, ' ').trim(),
      style: run[0].style,
      source: 'BOOK',
    });
    run = [];
  };

  for (const block of sorted) {
    const prev = run[run.length - 1];
    const continuesRun = prev && block.docxIndex === prev.docxIndex + 1 && block.page === prev.page;
    if (!continuesRun) flush();
    run.push(block);
  }
  flush();

  return entries;
}

export async function getToc(): Promise<TocEntry[]> {
  const pages = await getCollection('pages');
  const headingBlocks: HeadingBlock[] = [];
  for (const p of pages) {
    for (const b of p.data.blocks) {
      if (
        b.style &&
        ['Title', 'Heading1', 'Heading2'].includes(b.style) &&
        b.text_verbatim_slice.trim()
      ) {
        headingBlocks.push({
          page: p.data.page,
          docxIndex: b.docx_paragraph_index,
          style: b.style,
          text: b.text_verbatim_slice,
        });
      }
    }
  }

  const bookEntries = mergeHeadingRuns(headingBlocks);

  const bookByPage = new Map(bookEntries.map((e) => [e.page, e]));
  const policy = await getCollection('bookIndexEntries');

  const curated: TocEntry[] = [];

  for (const entry of policy) {
    const op = entry.data.operation;
    const book = bookByPage.get(entry.data.page);

    if (op === 'add') {
      // Only add if no BOOK heading exists at that page — never duplicate a
      // real heading with an editorial row.
      if (!book) {
        curated.push({
          page: entry.data.page,
          text: entry.data.label,
          style: 'editorial-label',
          source: 'EDITORIAL' as const,
        });
      }
      continue;
    }

    // rename (with or without suppress_subtitle) and merge: replace the text
    // of the BOOK-derived entry at that page with the policy label. Keep the
    // entry's page and style; source stays BOOK.
    if (book) {
      curated.push({ ...book, text: entry.data.label });
    } else {
      // Should not happen for rename/merge, but fall back to an BOOK row.
      curated.push({
        page: entry.data.page,
        text: entry.data.label,
        style: 'editorial-label',
        source: 'BOOK' as const,
      });
    }
  }

  const union = [...bookEntries, ...curated];
  const byPage = new Map<number, TocEntry>();
  for (const e of union) byPage.set(e.page, e); // last writer wins per page

  return [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, e]) => e);
}

/** Returns the most recent TOC entry at or before `pageNumber`, i.e. "what
 * section is the reader currently in". */
export function sectionForPage(toc: TocEntry[], pageNumber: number): TocEntry | null {
  let current: TocEntry | null = null;
  for (const entry of toc) {
    if (entry.page <= pageNumber) current = entry;
    else break;
  }
  return current;
}
