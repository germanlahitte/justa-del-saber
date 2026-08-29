"""Compare DOCX text vs PDF text at word level.

Normalizes whitespace/soft-breaks only (no content edits) and reports:
- words present in one source and missing in the other (sequence diff blocks)

Output: data/docx-pdf-diff.txt
SOURCE: BOOK (verification).
"""
import difflib
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

import pymupdf

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
DOCX = r'book\Graves decires de aguda intuición.docx'
PDF = r'book\Graves decires de aguda intuición.pdf'
OUT = r'data\docx-pdf-diff.txt'


def norm_words(text: str):
    # unify quotes/dashes/soft breaks for comparison only
    text = text.replace('\u200b', ' ').replace('\xa0', ' ')
    text = re.sub(r'[“”"«»]', '"', text)
    text = re.sub(r'[‘’´`]', "'", text)
    text = re.sub(r'[–—]', '-', text)
    words = re.findall(r'\S+', text)
    # drop bare page numbers (PDF folios)
    return [w for w in words]


def main() -> None:
    z = zipfile.ZipFile(DOCX)
    doc = ET.fromstring(z.read('word/document.xml'))

    def para_text(p):
        parts = []
        for node in p.iter():
            if node.tag == W + 't':
                parts.append(node.text or '')
            elif node.tag == W + 'br':
                parts.append('\n')
            elif node.tag == W + 'tab':
                parts.append('\t')
        return ''.join(parts)

    docx_text = '\n'.join(
        para_text(p) for p in doc.find(W + 'body') if p.tag == W + 'p'
    )
    pdf = pymupdf.open(PDF)
    pdf_words = []
    for i in range(pdf.page_count):
        page_words = norm_words(pdf[i].get_text('text'))
        # remove trailing folio (page number == i+1) wherever it appears standalone
        page_words = [w for w in page_words if w != str(i + 1)]
        pdf_words.extend(page_words)
    docx_words = norm_words(docx_text)

    sm = difflib.SequenceMatcher(a=docx_words, b=pdf_words, autojunk=False)
    blocks = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        blocks.append({
            'op': tag,
            'docx': ' '.join(docx_words[i1:i2])[:400],
            'pdf': ' '.join(pdf_words[j1:j2])[:400],
            'ctx_before': ' '.join(docx_words[max(0, i1 - 8):i1]),
        })
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(f'docx words: {len(docx_words)}, pdf words: {len(pdf_words)}\n')
        f.write(f'similarity ratio: {sm.ratio():.4f}\n')
        f.write(f'diff blocks: {len(blocks)}\n\n')
        for b in blocks:
            f.write(f"--- {b['op'].upper()}  (context: ...{b['ctx_before']})\n")
            f.write(f"  DOCX: {b['docx']!r}\n")
            f.write(f"  PDF : {b['pdf']!r}\n\n")
    print(f'docx words: {len(docx_words)}, pdf words: {len(pdf_words)}, '
          f'ratio: {sm.ratio():.4f}, diff blocks: {len(blocks)}')


if __name__ == '__main__':
    sys.exit(main())
