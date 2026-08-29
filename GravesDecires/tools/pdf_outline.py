"""Dump a compact per-page outline of the PDF (first lines of text per page).

Read-only. Output: data/pdf-outline.txt
SOURCE: BOOK.
"""
import sys

import pymupdf

PDF = r'book\Graves decires de aguda intuición.pdf'
OUT = r'data\pdf-outline.txt'


def main() -> None:
    doc = pymupdf.open(PDF)
    lines_out = []
    for i in range(doc.page_count):
        text = doc[i].get_text('text').strip()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        head = ' / '.join(lines[:6])
        n_imgs = len(doc[i].get_images(full=True))
        lines_out.append(f'p{i+1:02d} | imgs:{n_imgs} | chars:{len(text):5d} | {head[:220]}')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines_out))
    print('written', OUT)


if __name__ == '__main__':
    sys.exit(main())
