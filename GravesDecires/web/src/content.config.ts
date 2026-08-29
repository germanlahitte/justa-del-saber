// Content Collections wired directly to the canonical corpus of
// "Graves decires de aguda intuición", produced in Stages 1, 1.5 and the
// concepts/readings/master-map consolidation.
//
// IMPORTANT: this file only READS the canonical JSON files. It never
// duplicates, rewrites or regenerates them. Every schema below mirrors the
// contract already declared inside each source file (see the `contracts`
// field in readings-v0.3.json and `depends_on` in master-map-v0.2.json).
//
// SOURCE map:
//   book      -> ../data/book-model.json           (BOOK, verbatim, read-only)
//   pages     -> ../data/page-model.json           (BOOK, derived pagination — see tools/build_page_model.py)
//   assets    -> ../data/assets-manifest.json       (ASSET, read-only)
//   editorial -> ../data/editorial/*.json           (EDITORIAL, read-only)
//   sourceRefs -> ../data/source-references.json    (derived: BOOK+ASSET+EDITORIAL — see tools/build_source_references.py)
//   pagePresentation -> ../data/editorial/page-presentation.json (EDITORIAL: layout decisions only, no content)
//   bookIndex -> ../data/editorial/book-index.json  (EDITORIAL: web-only navigation labels, never BOOK content)
//   concepts  -> ../content/concepts/concepts-v0.3.json   (canonical v0.3)
//   readings  -> ../content/readings/readings-v0.3.json   (canonical v0.3)
//   masterMap -> ../content/maps/master-map-v0.2.json     (canonical v0.2)
//
// RE-BASELINE NOTE (docs/web/BOOK-REBASELINE-v0.1.md): BOOK/ASSET/PAGE were
// regenerated after the author corrected the source DOCX/PDF. Word renumbers
// embedded media filenames on every re-save, so any code that resolves an
// EDITORIAL asset_id must trust content identity (already re-resolved in
// data/song-references.json), never assume asset_id is stable across
// versions.
//
// PAGINATION CORRECTION (post Stage 3 review): BookUnit is a technical
// traceability unit (segmented by explicit DOCX page breaks), NOT a
// reading page. The `pages` collection below is the corrected primary
// surface for MODO LEER: one entry per real PDF page (1..78), derived by
// tools/build_page_model.py via word-level DOCX<->PDF alignment (verified
// 0 mismatches across all 1451 paragraphs — see
// tools/verify_page_model.py). BookUnit remains as internal traceability,
// referenced from each page's blocks[].book_unit.
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

// ---------------------------------------------------------------------------
// BOOK — data/book-model.json  (47 verbatim units)
// ---------------------------------------------------------------------------
const bookUnits = defineCollection({
  loader: file('../data/book-model.json', {
    parser: (text) =>
      JSON.parse(text).units.map((u: { unit: number }) => ({
        ...u,
        id: String(u.unit),
      })),
  }),
  schema: z.object({
    unit: z.number(),
    docx_paragraph_range: z.tuple([z.number(), z.number()]),
    pdf_pages_via_assets: z.union([z.array(z.number()), z.literal('UNKNOWN')]),
    headings: z.array(z.string()),
    song_credits: z.array(
      z.object({
        song_title: z.string(),
        album: z.string(),
        year: z.number(),
        band: z.string(),
        // Global docx paragraph range [title, credit-line] this printed
        // credit block occupies — used to suppress duplicate rendering of
        // the credit lines in MODO LEER once SourceReferenceFooter already
        // represents them (Problem #2 fix). null only for the rare
        // detect_credit() edge case with no preceding title paragraph.
        credit_paragraph_range: z.tuple([z.number(), z.number()]).nullable().optional(),
      }),
    ),
    assets: z.array(
      z.object({
        asset_id: z.string(),
        type: z.string(),
        pdf_page: z.union([z.number(), z.literal('UNKNOWN')]),
      }),
    ),
    text_verbatim: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// PAGE — data/page-model.json (78 real PDF pages, derived from BOOK)
// ---------------------------------------------------------------------------
const pages = defineCollection({
  loader: file('../data/page-model.json', {
    parser: (text) =>
      JSON.parse(text).pages.map((p: { page: number }) => ({
        ...p,
        id: String(p.page),
      })),
  }),
  schema: z.object({
    page: z.number(),
    book_units: z.array(z.number()),
    blocks: z.array(
      z.object({
        docx_paragraph_index: z.number(),
        book_unit: z.number().nullable(),
        style: z.string().nullable(),
        text_verbatim_slice: z.string(),
        continues_from_previous_page: z.boolean(),
        continues_on_next_page: z.boolean(),
      }),
    ),
    assets: z.array(z.string()),
    asset_placements: z.array(
      z.object({
        asset_id: z.string(),
        docx_paragraph_index: z.number(),
      }),
    ),
    is_visual_only: z.boolean(),
    is_blank_or_folio_only: z.boolean(),
  }),
});

// ---------------------------------------------------------------------------
// ASSET — data/assets-manifest.json (55 originals extracted from the DOCX)
// ---------------------------------------------------------------------------
const assets = defineCollection({
  loader: file('../data/assets-manifest.json', {
    parser: (text) => JSON.parse(text).assets,
  }),
  schema: z.object({
    id: z.string(),
    extracted_file: z.string(),
    original_path_in_docx: z.string(),
    sha256: z.string(),
    type: z.enum(['qr', 'imagen-editorial']),
    format: z.string().nullable().optional(),
    dimensions: z.string(),
    pdf_page: z.union([z.number(), z.literal('UNKNOWN')]),
    docx_anchor_paragraph: z.union([z.number(), z.literal('UNKNOWN')]),
    accompanies: z.string(),
    qr_value: z.string().optional(),
    qr_decode_method: z.string().optional(),
    qr_status: z.string().optional(),
    association_status: z.string(),
    association_method: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// EDITORIAL — data/editorial/asset-context.json + song-credits.json
// ---------------------------------------------------------------------------
const editorialAssetContext = defineCollection({
  loader: file('../data/editorial/asset-context.json', {
    parser: (text) => JSON.parse(text).asset_context,
  }),
  schema: z.object({
    id: z.string(),
    decision_id: z.string(),
    source: z.literal('EDITORIAL'),
    // Legacy entries (DEC-01..DEC-11) address by asset_id (resolved
    // against a saved old->new remap table). New entries (DEC-13+) address
    // by asset_sha256 directly, immune to Word's filename renumbering by
    // construction. See tools/build_source_references.py.
    asset_id: z.string().optional(),
    asset_sha256: z.string().optional(),
    asset_id_at_decision_time: z.string().optional(),
    pdf_page: z.number(),
    status: z.string().optional(),
    resolved_accompanies: z.object({
      type: z.string(),
      song_ref: z
        .object({
          id: z.string().optional(),
          title: z.string(),
          band: z.string(),
          album: z.string(),
          year: z.number(),
        })
        .nullable()
        .optional(),
      source_ref: z
        .object({
          description: z.string().optional(),
          band: z.string().optional(),
          author: z.string().optional(),
          person: z.string().optional(),
          event: z.string().optional(),
          year: z.number().optional(),
        })
        .optional(),
    }),
    editorial_description: z.string().optional(),
    note: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// SOURCE REFERENCE — data/source-references.json (derived: BOOK + ASSET + EDITORIAL)
// Generalized entity: a QR in the book does not always point to a song.
// SourceReference.type discriminates between "song" and non-song sources
// ("interview" | "press-conference" | "video" | "declaration" | "other").
// One entry per QR asset, resolved where the canonical sources allow it —
// never inferred at render time. See tools/build_source_references.py for
// the exact, deterministic resolution rules (same-unit single credit,
// same-PDF-page disambiguation for units with multiple credits, or an
// EDITORIAL override re-resolved by SHA-256 content identity, never by the
// DOCX-internal filename which Word renumbers on every re-save).
// Supersedes the earlier SongReference model (data/song-references.json,
// retired) which incorrectly assumed every QR was a song.
// ---------------------------------------------------------------------------
const sourceRefTypeSchema = z.enum([
  'song',
  'interview',
  'press-conference',
  'video',
  'declaration',
  'other',
]);

const sourceReferences = defineCollection({
  loader: file('../data/source-references.json', {
    parser: (text) => JSON.parse(text).references.map((r: { qr_asset_id: string }) => ({
      ...r,
      id: r.qr_asset_id,
    })),
  }),
  schema: z.object({
    qr_asset_id: z.string(),
    qr_value: z.string().optional(),
    pdf_page: z.number(),
    book_units: z.array(z.number()),
    source_ref: z
      .object({
        type: sourceRefTypeSchema,
        // song-specific fields
        title: z.string().nullable().optional(),
        album: z.string().nullable().optional(),
        // shared/non-song fields
        description: z.string().nullable().optional(),
        band: z.string().nullable().optional(),
        author: z.string().nullable().optional(),
        person: z.string().nullable().optional(),
        event: z.string().nullable().optional(),
        year: z.number().nullable().optional(),
        decision_id: z.string().nullable().optional(),
        // Global docx paragraph range of the PRINTED credit block (title +
        // album-year + band) this SourceReference represents, when that
        // credit exists in BOOK. Used to suppress those exact paragraphs
        // from normal page body rendering once SourceReferenceFooter
        // already shows the same information (Problem #2 fix). null when
        // there is no printed credit to suppress (e.g. band-role pages,
        // press-conference entries).
        credit_paragraph_range: z.tuple([z.number(), z.number()]).nullable().optional(),
      })
      .nullable(),
    resolution_source: z.string().nullable(),
  }),
});

// ---------------------------------------------------------------------------
// PAGE PRESENTATION — data/editorial/page-presentation.json (EDITORIAL)
// Declares ONLY which visual layout a page should use (e.g. "band-role" for
// pages 6/7/8). Never carries BOOK content — components read the actual
// text/assets from the `pages` collection; this only picks the variant.
// `blank` and `visual-only` layouts are NOT declared here: they are
// inferred automatically from pages.is_blank_or_folio_only /
// pages.is_visual_only. Only band-role and cover (curatorial decisions, not
// structural facts of the PDF) need an explicit entry. `role` is only
// present on band-role pages; cover pages address the existing Title blocks
// of page 1 directly and carry no role object.
// ---------------------------------------------------------------------------
const pagePresentations = defineCollection({
  loader: file('../data/editorial/page-presentation.json', {
    parser: (text) =>
      JSON.parse(text).pages.map((p: { page: number }) => ({
        ...p,
        id: String(p.page),
      })),
  }),
  schema: z.object({
    page: z.number(),
    layout: z.enum(['band-role', 'cover', 'right-italic']),
    role: z
      .object({
        band: z.string(),
        role_label: z.string(),
        short_phrase_book_unit: z.number().nullable(),
        short_phrase_note: z.string(),
      })
      .optional(),
    note: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// PAGE EDITORIAL — data/editorial/page-editorial.json (EDITORIAL)
// Layered quote/excerpt model (decisions 2/19), p1 cover layout (decision
// 3), p5 editorial footer (decision 5) and WEB-only source references
// (decision 9) built over the validated V3 baseline. Every entry is
// ANCHOR-BASED: it addresses existing BOOK blocks by docx_paragraph_index
// range, resolved at render time against the `pages` collection. It never
// inserts into text_verbatim, never hardcodes page numbers as CSS, never
// invents copy. The combined `entries` array carries a `rec_type`
// discriminator; the schema keeps every per-type field optional so a single
// file() loader/parser (same pattern as bookIndexEntries) stays simple.
// `quotes` (kind: excerpt|quote) may carry attribution_docx_paragraph
// (author/source line) and group (1|2) to separate multiple fragments on
// one page. `web_source_reference` reuses a CANONICAL SourceReference by
// qr_asset_id — never a new sourceReferences entry, never a duplicate QR.
// ---------------------------------------------------------------------------
const pageEditorial = defineCollection({
  loader: file('../data/editorial/page-editorial.json', {
    parser: (text) => JSON.parse(text).entries,
  }),
  schema: z.object({
    id: z.string(),
    rec_type: z.enum(['quote', 'web_source_reference', 'editorial_footer']),
    page: z.number(),
    kind: z.enum(['excerpt', 'quote']).optional(),
    docx_paragraph_range: z.tuple([z.number(), z.number()]).optional(),
    group: z.number().optional(),
    attribution_docx_paragraph: z.number().optional(),
    qr_asset_id: z.string().optional(),
    photo_align_right: z.boolean().optional(),
    suppress_credit_range: z.tuple([z.number(), z.number()]).optional(),
    note: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// BOOK INDEX — data/editorial/book-index.json (explicit editorial index policy)
// This file is now the explicit editorial curation policy for the combined
// /libro index. Each entry declares an auditable `operation` over the index:
//   - add    -> page has no BOOK heading; the editorial entry creates the row
//               (source EDITORIAL). Never duplicates a real heading.
//   - rename -> re-labels the merged BOOK heading at that page (source BOOK).
//   - merge  -> collapses contiguous heading fragments into ONE entry with a
//               combined label (source BOOK).
// `suppress_subtitle` (optional, only valid on rename) drops the trailing
// subtitle fragment from the index row — it stays untouched on the page.
// Pages NOT covered keep being auto-derived from BOOK headings (see
// src/lib/pageIndex.ts). This is EDITORIAL navigation, never BOOK content:
// never inserted into text_verbatim, never rendered as if printed on the page.
// ---------------------------------------------------------------------------
const bookIndexEntries = defineCollection({
  loader: file('../data/editorial/book-index.json', {
    parser: (text) => JSON.parse(text).entries,
  }),
  schema: z.object({
    id: z.string(),
    page: z.number(),
    label: z.string(),
    operation: z.enum(['add', 'rename', 'merge']),
    suppress_subtitle: z.boolean().optional(),
    note: z.string(),
  }),
});

const editorialSongCredits = defineCollection({
  loader: file('../data/editorial/song-credits.json', {
    parser: (text) => JSON.parse(text).song_credits,
  }),
  schema: z.object({
    id: z.string(),
    decision_id: z.string(),
    source: z.literal('EDITORIAL'),
    confidence: z.enum(['printed', 'editorial']),
    fragment_ref: z.object({
      book_unit_id: z.string(),
      docx_paragraph_range: z.tuple([z.number(), z.number()]),
      pdf_page: z.number(),
      excerpt_verbatim: z.string(),
      heading_context: z.string(),
    }),
    song_ref: z.object({
      id: z.string(),
      title: z.string(),
      band: z.string(),
      album: z.string(),
      year: z.number(),
    }),
    note: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// CONCEPTS v0.3 — content/concepts/concepts-v0.3.json (32 canonical concepts)
// ---------------------------------------------------------------------------
const concepts = defineCollection({
  loader: file('../content/concepts/concepts-v0.3.json', {
    parser: (text) => JSON.parse(text).concepts,
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    definition: z.string(),
    key_distinction: z.string().optional(),
    hypothesis: z.string().optional(),
    formula: z.string().optional(),
    function: z.string().optional(),
    scope_note: z.string().optional(),
    dimensions: z.array(z.string()).optional(),
    key_distinctions: z.array(z.string()).optional(),
    book_function: z.string().optional(),
    reading: z.string().optional(),
    relations: z.record(z.string(), z.array(z.string())),
    relation_note: z.string().optional(),
  }),
});

// ---------------------------------------------------------------------------
// READINGS v0.3 — content/readings/readings-v0.3.json (33 canonical readings)
// ---------------------------------------------------------------------------
const readings = defineCollection({
  loader: file('../content/readings/readings-v0.3.json', {
    parser: (text) => JSON.parse(text).readings,
  }),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    title: z.string(),
    section: z.string(),
    kind: z.string(),
    thesis: z.string(),
    connections: z.array(z.string()),
    book_refs: z.array(
      z.object({
        book_unit: z.number(),
        relation: z.string(),
        source: z.literal('BOOK'),
        evidence: z.object({
          pdf_pages: z.array(z.number()),
          matched_anchors: z.array(z.string()),
          anchor_hits: z.number(),
          page_overlap_hits: z.number(),
          docx_paragraph_range: z.tuple([z.number(), z.number()]),
        }),
      }),
    ),
    book_unit_link_status: z.string(),
    status: z.string(),
    concept_ids: z.array(z.string()),
    tags: z.array(z.string()),
  }),
});

// ---------------------------------------------------------------------------
// MASTER MAP v0.2 — content/maps/master-map-v0.2.json
// Loaded as THREE small collections (arcs, hypotheses, band axis) out of the
// same file, using the file() loader's parser callback — the documented
// Astro pattern for extracting several collections from one nested JSON.
// ---------------------------------------------------------------------------
const mapArcs = defineCollection({
  loader: file('../content/maps/master-map-v0.2.json', {
    parser: (text) => JSON.parse(text).arcs,
  }),
  schema: z.object({
    id: z.string(),
    order: z.number(),
    title: z.string(),
    question: z.string(),
    concept_ids: z.array(z.string()),
    reading_ids: z.array(z.string()),
    claim: z.string(),
  }),
});

const mapHypotheses = defineCollection({
  loader: file('../content/maps/master-map-v0.2.json', {
    parser: (text) =>
      JSON.parse(text).structural_hypotheses.map((h: { id: string }) => ({
        ...h,
        // avoid collision with Astro's reserved "id" casing expectations
        id: h.id,
      })),
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    statement: z.string(),
    concept_ids: z.array(z.string()),
    reading_ids: z.array(z.string()),
  }),
});

const mapBandAxis = defineCollection({
  loader: file('../content/maps/master-map-v0.2.json', {
    parser: (text) =>
      JSON.parse(text).band_meta_axis.map(
        (b: { band: string }, i: number) => ({
          ...b,
          id: String(i),
        }),
      ),
  }),
  schema: z.object({
    id: z.string(),
    band: z.string(),
    role: z.string(),
    function: z.string(),
  }),
});

// The map's top-level fields that are not per-entry lists (core_thesis,
// terminal_structure, navigation_entry_points) are read directly by pages
// via a small helper (see src/lib/masterMap.ts) instead of forcing them
// into a fake single-entry collection.

export const collections = {
  bookUnits,
  pages,
  assets,
  editorialAssetContext,
  editorialSongCredits,
  bookIndexEntries,
  sourceReferences,
  pagePresentations,
  pageEditorial,
  concepts,
  readings,
  mapArcs,
  mapHypotheses,
  mapBandAxis,
};
