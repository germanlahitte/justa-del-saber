"""Association v2: assign each asset to song/chapter using its PDF page text.

Rules (evidence-based, no guessing):
1. If a detected song credit (title + band) appears in the text of the asset's
   PDF page -> accompanies that song.
2. Else if a chapter heading appears on that page -> accompanies that chapter.
3. Else -> UNKNOWN (typically full-page editorial images on pages w/o text).

Updates data/assets-manifest.json in place (association fields only).
SOURCE: ASSET.
"""
import json
import re
import sys
import unicodedata

import pymupdf

PDF = r'book\Graves decires de aguda intuición.pdf'
MANIFEST = r'data\assets-manifest.json'
MODEL = r'data\book-model.json'

CHAPTERS = [
    'La Estética', 'La Ética', 'La Síntesis',
    'Enajenación', 'Individualismo', 'Represión', 'Domesticación',
    'Destrucción del entramado social', 'Los Nadies',
    'Desarrollo de la subjetividad', 'La libertad individual',
    'La libertad de todos',
]


def norm(s: str) -> str:
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.replace('\u200b', '').lower()
    return re.sub(r'\s+', ' ', s)


def main() -> None:
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    model = json.load(open(MODEL, encoding='utf-8'))

    songs = []
    seen = set()
    for u in model['units']:
        for c in u['song_credits']:
            key = (c['song_title'], c['band'], c['album'], c['year'])
            if key not in seen:
                seen.add(key)
                songs.append(c)

    doc = pymupdf.open(PDF)
    page_text = {i + 1: norm(doc[i].get_text('text')) for i in range(doc.page_count)}

    for a in manifest['assets']:
        page = a['pdf_page']
        if not isinstance(page, int):
            a['accompanies'] = 'UNKNOWN'
            a['association_method'] = 'no-pdf-page'
            continue
        text = page_text[page]
        hits = [s for s in songs
                if norm(s['song_title']) in text and norm(s['band']) in text]
        if len(hits) == 1:
            s = hits[0]
            a['accompanies'] = f"{s['song_title']} ({s['band']}, {s['album']} - {s['year']})"
            a['association_method'] = 'song-credit-on-same-pdf-page'
            continue
        if len(hits) > 1:
            a['accompanies'] = 'NEEDS-REVIEW'
            a['association_method'] = ('multiple-song-credits-on-page: '
                                       + '; '.join(h['song_title'] for h in hits))
            continue
        ch_hits = [ch for ch in CHAPTERS if norm(ch) in text]
        if ch_hits:
            a['accompanies'] = 'Sección: ' + ' / '.join(ch_hits)
            a['association_method'] = 'chapter-heading-on-same-pdf-page'
        else:
            a['accompanies'] = 'UNKNOWN'
            a['association_method'] = 'page-has-no-identifying-text (full-page image)'

    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    for a in manifest['assets']:
        print(f"p{a['pdf_page']!s:>3} | {a['extracted_file'].split('/')[-1]:14s} | "
              f"{a['type']:16s} | {a['accompanies']}")


if __name__ == '__main__':
    sys.exit(main())
