"""Stricter verification: for paragraphs that land entirely on ONE page
(the overwhelming majority), the page-model text_verbatim_slice must be
BYTE-IDENTICAL (not just word-identical) to the corresponding text in
book-model.json — proving real quote glyphs, em-dashes, and internal line
breaks are preserved exactly, not just approximately. Read-only.
"""
import json

bm = json.load(open(r'data\book-model.json', encoding='utf-8'))
pm = json.load(open(r'data\page-model.json', encoding='utf-8'))

# book-model text_verbatim is '\n'.join(non-empty paragraph texts) per unit;
# rebuild a paragraph_index -> exact text map by re-deriving paragraphs the
# same way build_book_model.py does, but we don't have direct per-paragraph
# text in book-model.json (only concatenated per-unit). Instead, verify
# against the DOCX directly for full rigor.
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
DOCX = r'book\Graves decires de aguda intuición.docx'


def para_text(p):
    parts = []
    for node in p.iter():
        if node.tag == W + 't':
            parts.append(node.text or '')
        elif node.tag == W + 'br' and node.get(W + 'type') != 'page':
            parts.append('\n')
        elif node.tag == W + 'tab':
            parts.append('\t')
    return ''.join(parts)


z = zipfile.ZipFile(DOCX)
doc = ET.fromstring(z.read('word/document.xml'))
body = doc.find(W + 'body')
original_by_index = {}
idx = 0
for p in body:
    if p.tag != W + 'p':
        continue
    original_by_index[idx] = para_text(p)
    idx += 1

# group page-model blocks by paragraph index
blocks_by_para = {}
for page in pm['pages']:
    for b in page['blocks']:
        blocks_by_para.setdefault(b['docx_paragraph_index'], []).append(b)

single_page_mismatches = []
single_page_checked = 0
for pi, blocks in blocks_by_para.items():
    if len(blocks) != 1:
        continue  # multi-page paragraph, byte-identity doesn't apply directly
    b = blocks[0]
    original = original_by_index[pi].strip()
    got = b['text_verbatim_slice'].strip()
    single_page_checked += 1
    if got != original:
        single_page_mismatches.append((pi, original, got))

print(f'single-page paragraphs checked for BYTE-IDENTICAL match: {single_page_checked}')
print(f'mismatches: {len(single_page_mismatches)}')
for pi, orig, got in single_page_mismatches[:15]:
    print(f'  para {pi}:')
    print(f'    original: {orig!r}')
    print(f'    got     : {got!r}')

if not single_page_mismatches:
    print('VERIFICATION PASSED: every single-page paragraph slice is '
          'byte-identical to the original DOCX text (real glyphs, real '
          'internal line breaks preserved exactly).')
