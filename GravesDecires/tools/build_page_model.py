"""Build data/page-model.json — the real PAGINATED structure of the book.

CORRECTION (post Stage 3 review): BookUnit (segmented by explicit DOCX page
breaks) is NOT the same thing as a physical PDF page. The DOCX author only
inserted *manual* page breaks at structural points (section starts, new
songs); the *final* PDF (rendered by Google Docs) additionally reflows text
automatically whenever a BookUnit's content overflows one physical page.
That is why, e.g., BookUnit 3 (the V8/Hermética/Almafuerte presentation)
actually spans PDF pages 6, 7 and 9 — three physical pages, one BookUnit.

This script derives one `Page` entry per real PDF page (1..79) by aligning
DOCX paragraph words to PDF page words at word-level granularity (the same
alignment technique already used and verified in
tools/compare_docx_pdf.py, where DOCX vs PDF text matched at 99.99%
similarity with a single trivial exception). For each PDF page, we record:

  - which DOCX paragraphs contribute text to that page (by index),
  - the exact verbatim text-slice of each paragraph that falls on that page
    (paragraphs that overflow onto the next page ARE split at the correct
    word boundary — never duplicated, never summarized),
  - which BookUnit(s) overlap that page,
  - which assets (images/QR) appear on that page, using the already
    verified perceptual page match from data/assets-manifest.json (image
    position is resolved via asset->page mapping, not word alignment, since
    images produce no text words).

This is a purely technical derivation over already-canonical BOOK/ASSET
sources. It creates a NEW read-only artifact (data/page-model.json) and
does not modify book-model.json, assets-manifest.json, the DOCX or the PDF.

SOURCE: BOOK (derived structural view, verbatim text only).
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from difflib import SequenceMatcher
from xml.etree import ElementTree as ET

import pymupdf

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

DOCX = r'book\Graves decires de aguda intuición.docx'
PDF = r'book\Graves decires de aguda intuición.pdf'
BOOK_MODEL = r'data\book-model.json'
ASSETS_MANIFEST = r'data\assets-manifest.json'
OUT = r'data\page-model.json'


def normalize_for_alignment(text: str) -> str:
    """Character-for-character (1:1) normalization used ONLY to align DOCX
    words against PDF words (different quote/dash glyphs, zero-width
    spaces). Every substitution here maps exactly one character to exactly
    one character, which is essential: it means word offsets computed on
    the normalized text are byte-identical to offsets in the ORIGINAL text,
    so we can tokenize on the normalized string but slice the ORIGINAL
    string (preserving real newlines, real quote glyphs) using those same
    offsets. See tokenize_with_offsets().
    """
    text = text.replace('\u200b', ' ').replace('\xa0', ' ')
    text = re.sub(r'[""«»]', '"', text)
    text = re.sub(r"[''´`]", "'", text)
    text = re.sub(r'[–—]', '-', text)
    return text


def norm_words(text: str) -> list[str]:
    return re.findall(r'\S+', normalize_for_alignment(text))


def tokenize_with_offsets(text: str) -> list[tuple[str, int, int]]:
    """Returns (word, start, end) for every non-whitespace token, where
    start/end are character offsets valid in BOTH the normalized text (used
    to build `word`) and the ORIGINAL text (used later to slice verbatim
    substrings that preserve internal line breaks — Problem #3 fix: PDF
    decides pagination, DOCX decides internal text structure, so the final
    text_verbatim_slice must be a real substring of the original paragraph
    text, never a re-joined word list)."""
    normalized = normalize_for_alignment(text)
    return [(m.group(), m.start(), m.end()) for m in re.finditer(r'\S+', normalized)]


def para_text(p) -> str:
    parts: list[str] = []
    for node in p.iter():
        if node.tag == W + 't':
            parts.append(node.text or '')
        elif node.tag == W + 'br' and node.get(W + 'type') != 'page':
            parts.append('\n')
        elif node.tag == W + 'tab':
            parts.append('\t')
    return ''.join(parts)


def load_docx_paragraphs():
    z = zipfile.ZipFile(DOCX)
    doc = ET.fromstring(z.read('word/document.xml'))
    rels = ET.fromstring(z.read('word/_rels/document.xml.rels'))
    relmap = {rel.get('Id'): rel.get('Target') for rel in rels}
    body = doc.find(W + 'body')
    paras = []
    for p in body:
        if p.tag != W + 'p':
            continue
        style_el = p.find(W + 'pPr/' + W + 'pStyle')
        style = style_el.get(W + 'val') if style_el is not None else None
        imgs = []
        for blip in p.iter(A + 'blip'):
            rid = blip.get(R + 'embed')
            if rid:
                imgs.append(relmap.get(rid, '').split('/')[-1])
        pagebreak = any(b.get(W + 'type') == 'page' for b in p.iter(W + 'br'))
        text = para_text(p)
        paras.append({
            'index': len(paras),
            'style': style,
            'text': text,
            'images': imgs,
            'pagebreak': pagebreak,
        })
    return paras


def main() -> None:
    paras = load_docx_paragraphs()
    book_model = json.load(open(BOOK_MODEL, encoding='utf-8'))
    manifest = json.load(open(ASSETS_MANIFEST, encoding='utf-8'))

    # paragraph index -> BookUnit number (BookUnit ranges are contiguous and
    # non-overlapping by construction in build_book_model.py)
    unit_by_para: dict[int, int] = {}
    for u in book_model['units']:
        lo, hi = u['docx_paragraph_range']
        for i in range(lo, hi + 1):
            unit_by_para[i] = u['unit']

    # asset_id -> pdf_page (perceptual match, already verified in Stage 1)
    page_by_asset = {a['id']: a['pdf_page'] for a in manifest['assets']
                     if isinstance(a['pdf_page'], int)}

    # ---- Build the flat DOCX word stream, each word tagged with its
    # paragraph index and its position within that paragraph's own token
    # list. Also keep the (start, end) character offsets of each token in
    # the paragraph's ORIGINAL text (with real \n / \t preserved) so the
    # final text can be sliced verbatim instead of rejoined with spaces
    # (Problem #3 fix).
    docx_words: list[str] = []
    docx_word_owner: list[tuple[int, int]] = []  # (paragraph_index, word_idx_in_para)
    para_tokens: dict[int, list[tuple[str, int, int]]] = {}
    for p in paras:
        tokens = tokenize_with_offsets(p['text'])
        para_tokens[p['index']] = tokens
        for wi, (w, _, _) in enumerate(tokens):
            docx_words.append(w)
            docx_word_owner.append((p['index'], wi))

    # ---- Build the flat PDF word stream, each word tagged with its page.
    pdf = pymupdf.open(PDF)
    pdf_words: list[str] = []
    pdf_word_page: list[int] = []
    for i in range(pdf.page_count):
        page_no = i + 1
        words = norm_words(pdf[i].get_text('text'))
        words = [w for w in words if w != str(page_no)]  # drop folio
        for w in words:
            pdf_words.append(w)
            pdf_word_page.append(page_no)

    # ---- Align (same technique verified in compare_docx_pdf.py: 99.99%
    # word-level similarity, single trivial mismatch block).
    sm = SequenceMatcher(a=docx_words, b=pdf_words, autojunk=False)
    # docx_word_index -> pdf_page ; None where alignment couldn't resolve
    # (only the tiny known mismatch block, handled by leaving it unmapped —
    # it inherits the surrounding page via paragraph-level fallback below).
    page_for_docx_word: list[int | None] = [None] * len(docx_words)
    unmapped_blocks = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                page_for_docx_word[i1 + k] = pdf_word_page[j1 + k]
        else:
            unmapped_blocks += 1

    # ---- For each paragraph, determine which page(s) its words fall on,
    # in order, and the exact word-index boundaries for any split.
    # paragraph_index -> list of (page, first_word_idx, last_word_idx)
    para_page_spans: dict[int, list[tuple[int, int, int]]] = {}
    for p in paras:
        n_words = len(para_tokens[p['index']])
        if n_words == 0:
            continue
        # word indices for this paragraph in the flat docx_words array
        start = next(i for i, (pi, wi) in enumerate(docx_word_owner) if pi == p['index'] and wi == 0)
        pages_seq = [page_for_docx_word[start + k] for k in range(n_words)]
        # fill unmapped (None) words with nearest known neighbour so the
        # tiny alignment gap never breaks page assignment
        for k in range(n_words):
            if pages_seq[k] is None:
                # look left then right
                left = next((pages_seq[j] for j in range(k - 1, -1, -1) if pages_seq[j] is not None), None)
                right = next((pages_seq[j] for j in range(k + 1, n_words) if pages_seq[j] is not None), None)
                pages_seq[k] = left if left is not None else right
        if all(pg is None for pg in pages_seq):
            continue
        spans = []
        cur_page = pages_seq[0]
        span_start = 0
        for k in range(1, n_words):
            if pages_seq[k] != cur_page:
                spans.append((cur_page, span_start, k - 1))
                cur_page = pages_seq[k]
                span_start = k
        spans.append((cur_page, span_start, n_words - 1))
        para_page_spans[p['index']] = spans

    # ---- Compose Page entries. A paragraph contributing a span to page N
    # renders the verbatim words[first..last] of that paragraph joined with
    # single spaces (word-level rejoin — soft newlines inside a paragraph
    # are already rare inside a single physical page and are preserved via
    # the paragraph's own \n structure when the whole paragraph lands on
    # one page, which is the overwhelming majority case; see report for the
    # few multi-page paragraphs found).
    pages: dict[int, dict] = {i: {'page': i, 'blocks': [], 'assets': [],
                                  'book_units': set()} for i in range(1, pdf.page_count + 1)}
    # asset placement tracked separately (with anchor order) so it can be
    # interleaved with text blocks in true document order when rendering.
    asset_placements: dict[int, list[dict]] = {i: [] for i in range(1, pdf.page_count + 1)}

    # ---- SHA-first blip resolution. Word renumbers embedded media
    # (image1.png -> image48.png) and swaps extensions on every re-save, so
    # a DOCX-internal filename is NEVER asset identity. A blip names a media
    # file inside THIS docx; resolve name -> bytes -> sha256 -> asset_id.
    asset_id_by_sha = {a['sha256']: a['id'] for a in manifest['assets']}
    with zipfile.ZipFile(DOCX) as zz:
        blip_sha_by_name = {
            info.filename.split('/')[-1]: hashlib.sha256(zz.read(info.filename)).hexdigest()
            for info in zz.infolist()
            if info.filename.startswith('word/media/')
        }

    def asset_id_for_blip(blip_name: str) -> str | None:
        sha = blip_sha_by_name.get(blip_name)
        return asset_id_by_sha.get(sha) if sha else None

    for p in paras:
        unit = unit_by_para.get(p['index'])
        spans = para_page_spans.get(p['index'])
        if spans:
            tokens = para_tokens[p['index']]
            n_words = len(tokens)
            for (page, first, last) in spans:
                is_partial = not (first == 0 and last == n_words - 1)
                # PDF decides WHICH slice of the paragraph falls on this
                # page (word boundaries `first`/`last`); DOCX decides the
                # verbatim INTERNAL structure of that slice (line breaks,
                # spacing) — Problem #3 fix: slice the ORIGINAL paragraph
                # text by character offset instead of rejoining tokens with
                # spaces, so internal \n (verse breaks) are preserved
                # exactly as authored, never flattened into prose.
                char_start = tokens[first][1]
                char_end = tokens[last][2]
                text_slice = p['text'][char_start:char_end]
                pages[page]['blocks'].append({
                    'docx_paragraph_index': p['index'],
                    'book_unit': unit,
                    'style': p['style'],
                    'text_verbatim_slice': text_slice,
                    'continues_from_previous_page': is_partial and first != 0,
                    'continues_on_next_page': is_partial and last != n_words - 1,
                })
                if unit is not None:
                    pages[page]['book_units'].add(unit)
        # Images are assigned via the verified SHA-resolved asset->page match
        # (data/assets-manifest.json), independent of word alignment, and
        # independent of whether this paragraph carried any text at all
        # (an image-only paragraph has no text span but must still place
        # its asset on the correct page).
        for img in p['images']:
            asset_id = asset_id_for_blip(img)
            if asset_id and asset_id in page_by_asset:
                target_page = page_by_asset[asset_id]
                pages[target_page]['assets'].append(asset_id)
                asset_placements[target_page].append({
                    'asset_id': asset_id,
                    'docx_paragraph_index': p['index'],
                })
                if unit is not None:
                    pages[target_page]['book_units'].add(unit)

    # ---- Serialize
    out_pages = []
    for page_no in range(1, pdf.page_count + 1):
        entry = pages[page_no]
        placements = sorted(asset_placements[page_no], key=lambda x: x['docx_paragraph_index'])
        out_pages.append({
            'page': page_no,
            'book_units': sorted(entry['book_units']),
            'blocks': entry['blocks'],
            'assets': sorted(set(entry['assets'])),
            'asset_placements': placements,
            'is_visual_only': len(entry['blocks']) == 0 and len(entry['assets']) > 0,
            'is_blank_or_folio_only': len(entry['blocks']) == 0 and len(entry['assets']) == 0,
        })

    multi_page_paragraphs = sum(1 for spans in para_page_spans.values() if len(spans) > 1)

    result = {
        'source': {
            'docx': DOCX.replace('\\', '/'),
            'pdf': PDF.replace('\\', '/'),
            'derived_from': 'data/book-model.json + data/assets-manifest.json',
        },
        'method': 'word-level alignment between DOCX paragraph text and PDF '
                  'page text (same technique as tools/compare_docx_pdf.py, '
                  '99.99% match); images placed via verified perceptual '
                  'asset-to-page match, not word alignment.',
        'traceability': 'SOURCE: BOOK (derived). page.blocks[].book_unit '
                        'points to the canonical BookUnit; '
                        'text_verbatim_slice is an exact word-level slice '
                        'of that BookUnit\'s original paragraph text, never '
                        'rewritten.',
        'page_count': pdf.page_count,
        'multi_page_paragraphs': multi_page_paragraphs,
        'unmapped_alignment_blocks': unmapped_blocks,
        'pages': out_pages,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f'pages: {pdf.page_count}')
    print(f'paragraphs split across >1 page: {multi_page_paragraphs}')
    print(f'unmapped alignment blocks (expected 1, the known "8 discos" case): {unmapped_blocks}')
    visual_only = sum(1 for p in out_pages if p['is_visual_only'])
    blank = sum(1 for p in out_pages if p['is_blank_or_folio_only'])
    print(f'visual-only pages (assets, no text): {visual_only}')
    print(f'blank/folio-only pages: {blank}')


if __name__ == '__main__':
    sys.exit(main())
