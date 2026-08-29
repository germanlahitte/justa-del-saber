// EditorialQuoteData — the RESOLVED shape of one editorial quote/excerpt
// (decisions 2/19 of PAGE-REVIEW), produced by the route from
// data/editorial/page-editorial.json entries anchored on docx_paragraph_index
// ranges resolved against the `pages` collection. All text is BOOK verbatim
// (text_verbatim_slice joined with "\n"), never invented.
export interface EditorialQuoteData {
  id: string;
  quoteText: string;
  attribution: string | null;
  kind: 'excerpt' | 'quote';
  group: number | undefined;
  docxParagraphRange: [number, number];
  // The BOOK paragraph consumed as the quote's attribution line
  // (attribution_docx_paragraph). PageView must treat this paragraph as
  // CONSUMED and never render it again as generic body — it lives only
  // inside <EditorialQuote>. Undefined when the quote has no attribution.
  attributionDocxParagraph?: number;
}