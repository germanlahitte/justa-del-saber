"""Final association: merge DOCX-anchor evidence with PDF-page-text evidence.

Evidence A (DOCX): the image is anchored inside/adjacent to a song block
  (title -> lyrics -> credit) in the DOCX flow.
Evidence B (PDF): the song credit text appears on the same PDF page where the
  image was perceptually matched.

Verdicts:
- both agree           -> association_status: verified
- only one available   -> association_status: single-evidence (kept, method noted)
- disagree             -> association_status: NEEDS-REVIEW (both candidates listed)
- neither              -> UNKNOWN (or chapter if a heading is on the page)

No external navigation, no invention. SOURCE: ASSET.
Rewrites data/assets-manifest.json association fields.
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

    # song credits per model unit; images per unit -> Evidence A
    ev_a = {}  # media filename -> credit dict
    for u in model['units']:
        credits = u['song_credits']
        if len(credits) == 1:
            for asset in u['assets']:
                media = asset['asset_id'].replace('asset-', '')
                ev_a.setdefault(media, credits[0])
        # units with multiple credits: attribute only if the image is anchored
        # between a title and its credit — too fragile; leave to Evidence B.

    songs = []
    seen = set()
    for u in model['units']:
        for c in u['song_credits']:
            key = (c['song_title'], c['band'])
            if key not in seen:
                seen.add(key)
                songs.append(c)

    doc = pymupdf.open(PDF)
    page_text = {i + 1: norm(doc[i].get_text('text')) for i in range(doc.page_count)}

    def fmt(c):
        return f"{c['song_title']} ({c['band']}, {c['album']} - {c['year']})"

    for a in manifest['assets']:
        media_key = a['extracted_file'].split('/')[-1].rsplit('.', 1)[0]
        # extraction key uses full name; ev_a keyed by asset id stem
        cand_a = None
        for k, v in ev_a.items():
            if k.rsplit('.', 1)[0] == media_key or k == media_key:
                cand_a = v
                break

        page = a['pdf_page']
        text = page_text.get(page, '') if isinstance(page, int) else ''
        hits_b = [s for s in songs
                  if norm(s['song_title']) in text and norm(s['band']) in text]
        cand_b = hits_b[0] if len(hits_b) == 1 else None

        if cand_a and cand_b:
            if (cand_a['song_title'], cand_a['band']) == (cand_b['song_title'], cand_b['band']):
                a['accompanies'] = fmt(cand_a)
                a['association_status'] = 'verified'
                a['association_method'] = 'docx-anchor + pdf-page-text agree'
            else:
                a['accompanies'] = 'NEEDS-REVIEW'
                a['association_status'] = 'NEEDS-REVIEW'
                a['association_method'] = (f'conflict: docx-anchor={fmt(cand_a)} '
                                           f'vs pdf-page={fmt(cand_b)}')
        elif cand_a:
            a['accompanies'] = fmt(cand_a)
            a['association_status'] = 'single-evidence'
            a['association_method'] = 'docx-anchor (image inside song unit)'
        elif cand_b:
            a['accompanies'] = fmt(cand_b)
            a['association_status'] = 'single-evidence'
            a['association_method'] = 'pdf-page-text (credit on same page)'
        elif len(hits_b) > 1:
            a['accompanies'] = 'NEEDS-REVIEW'
            a['association_status'] = 'NEEDS-REVIEW'
            a['association_method'] = ('multiple credits on pdf page: '
                                       + '; '.join(fmt(h) for h in hits_b))
        else:
            ch = [c for c in CHAPTERS if norm(c) in text]
            if ch:
                a['accompanies'] = 'Sección: ' + ' / '.join(ch)
                a['association_status'] = 'section-level'
                a['association_method'] = 'chapter-heading-on-pdf-page'
            else:
                a['accompanies'] = 'UNKNOWN'
                a['association_status'] = 'UNKNOWN'
                a['association_method'] = 'no textual evidence on page'

    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    counts = {}
    for a in manifest['assets']:
        counts[a['association_status']] = counts.get(a['association_status'], 0) + 1
    print('association status counts:', counts)
    for a in manifest['assets']:
        if a['association_status'] in ('NEEDS-REVIEW', 'UNKNOWN'):
            print(f"p{a['pdf_page']!s:>3} | {a['extracted_file'].split('/')[-1]:14s} | "
                  f"{a['type']:16s} | {a['association_status']} | {a['association_method']}")


if __name__ == '__main__':
    sys.exit(main())
