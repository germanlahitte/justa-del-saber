"""Map PDF pages: text snippets and embedded images matched to DOCX media by digest.

Read-only over the PDF. Matching strategy:
1. Exact sha256 of embedded stream vs extracted DOCX file.
2. Fallback: perceptual comparison NOT used automatically; unmatched images are
   reported for manual review (no guessing).

Output: data/pdf-map.json
SOURCE: BOOK (structural mapping).
"""
import hashlib
import json
import os
import sys

import pymupdf

PDF = r'book\Graves decires de aguda intuición.pdf'
MEDIA = r'assets\docx-media'
OUT = r'data\pdf-map.json'


def main() -> None:
    # digest -> docx media filename
    digests = {}
    for name in os.listdir(MEDIA):
        with open(os.path.join(MEDIA, name), 'rb') as f:
            digests[hashlib.sha256(f.read()).hexdigest()] = name

    doc = pymupdf.open(PDF)
    pages = []
    matched, unmatched = 0, 0
    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text('text').strip()
        imgs = []
        for img in page.get_images(full=True):
            xref = img[0]
            raw = doc.xref_stream_raw(xref)
            sha = hashlib.sha256(raw).hexdigest()
            entry = {'xref': xref, 'sha256': sha}
            if sha in digests:
                entry['docx_media'] = digests[sha]
                matched += 1
            else:
                # try decoded pixmap-independent full stream
                entry['docx_media'] = None
                unmatched += 1
            imgs.append(entry)
        pages.append({
            'page': i + 1,
            'text_snippet': text[:300],
            'char_count': len(text),
            'images': imgs,
        })
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'pdf': PDF, 'page_count': doc.page_count,
                   'images_matched': matched, 'images_unmatched': unmatched,
                   'pages': pages}, f, ensure_ascii=False, indent=2)
    print(f'pages: {doc.page_count}, images matched: {matched}, unmatched: {unmatched}')


if __name__ == '__main__':
    sys.exit(main())
