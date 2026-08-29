"""Build data/book-model.json — full structured, verbatim model of the book.

Model design:
- The DOCX is segmented by explicit page breaks into sequential "units".
- Each unit carries VERBATIM text (soft line breaks preserved as \n),
  anchored images, detected song credits, and traceability pointers
  (DOCX paragraph range, PDF page via asset perceptual match).
- Nothing is rewritten, summarized, or completed. Where a block type cannot
  be determined safely it is marked UNKNOWN.

SOURCE: BOOK.
"""
import hashlib
import json
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

DOCX = r'book\Graves decires de aguda intuición.docx'
BANDS = {'V8', 'Hermética', 'Almafuerte'}
CREDIT_RE = re.compile(r'^(.{2,60}?)\s*[-–]\s*(\d{4})\s*$')


def para_text(p):
    """Verbatim text of a paragraph with soft breaks as newlines."""
    parts = []
    for node in p.iter():
        if node.tag == W + 't':
            parts.append(node.text or '')
        elif node.tag == W + 'br' and node.get(W + 'type') != 'page':
            parts.append('\n')
        elif node.tag == W + 'tab':
            parts.append('\t')
    return ''.join(parts)


def main() -> None:
    z = zipfile.ZipFile(DOCX)
    doc = ET.fromstring(z.read('word/document.xml'))
    rels = ET.fromstring(z.read('word/_rels/document.xml.rels'))
    relmap = {rel.get('Id'): rel.get('Target') for rel in rels}
    body = doc.find(W + 'body')

    manifest = json.load(open(r'data\assets-manifest.json', encoding='utf-8'))
    # Canonical identity by SHA-256, never by DOCX-internal filename (Word
    # renumbers/swaps extensions on every re-save). A blip names a media
    # file inside THIS docx; we resolve it to bytes -> sha256 -> asset.
    asset_by_sha = {a['sha256']: a for a in manifest['assets']}
    media_sha_by_name: dict[str, str] = {}
    for info in z.infolist():
        if not info.filename.startswith('word/media/'):
            continue
        media_sha_by_name[info.filename.split('/')[-1]] = \
            hashlib.sha256(z.read(info.filename)).hexdigest()

    def asset_for_blip(blip_name: str):
        sha = media_sha_by_name.get(blip_name)
        return asset_by_sha.get(sha) if sha else None

    print('media files in docx:', len(media_sha_by_name))
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
        paras.append({'i': len(paras), 'style': style, 'text': para_text(p),
                      'images': imgs, 'pagebreak': pagebreak})

    # segment by page breaks
    units, current = [], {'paras': [], 'start': 0}
    for p in paras:
        current['paras'].append(p)
        if p['pagebreak']:
            units.append(current)
            current = {'paras': [], 'start': p['i'] + 1}
    if current['paras']:
        units.append(current)

    def detect_credit(unit_paras):
        """Detect printed song-credit blocks (title / album-year / band) and
        record the GLOBAL docx paragraph range they occupy, so the web layer
        can later identify which paragraphs are the printed credit for a
        given song without any textual guessing (Problem #2 fix). k, j, idx
        below are LOCAL indices into unit_paras; the recorded range uses
        each paragraph's own global `i` field, never the local index.
        """
        found = []
        for idx, p in enumerate(unit_paras):
            if p['text'].strip() in BANDS:
                j = idx - 1
                while j >= 0 and not unit_paras[j]['text'].strip():
                    j -= 1
                m = CREDIT_RE.match(unit_paras[j]['text'].strip()) if j >= 0 else None
                if m:
                    k = j - 1
                    while k >= 0 and not unit_paras[k]['text'].strip():
                        k -= 1
                    found.append({
                        'song_title': unit_paras[k]['text'].strip() if k >= 0 else 'UNKNOWN',
                        'album': m.group(1).strip(),
                        'year': int(m.group(2)),
                        'band': p['text'].strip(),
                        'credit_paragraph_range': (
                            [unit_paras[k]['i'], unit_paras[idx]['i']] if k >= 0 else None
                        ),
                    })
        return found

    model_units = []
    for n, u in enumerate(units):
        texts = [p['text'] for p in u['paras'] if p['text'].strip()]
        imgs = [img for p in u['paras'] for img in p['images']]
        headings = [p['text'].strip() for p in u['paras']
                    if p['style'] in ('Title', 'Heading1', 'Heading2') and p['text'].strip()]
        credits = detect_credit(u['paras'])
        assets = []
        pdf_pages = set()
        for img in imgs:
            a = asset_for_blip(img)
            if a:
                assets.append({'asset_id': a['id'], 'type': a['type'],
                               'pdf_page': a['pdf_page']})
                if isinstance(a['pdf_page'], int):
                    pdf_pages.add(a['pdf_page'])
        model_units.append({
            'unit': n + 1,
            'docx_paragraph_range': [u['paras'][0]['i'], u['paras'][-1]['i']],
            'pdf_pages_via_assets': sorted(pdf_pages) if pdf_pages else 'UNKNOWN',
            'headings': headings,
            'song_credits': credits,
            'assets': assets,
            'text_verbatim': '\n'.join(texts),
        })

    model = {
        'source': {
            'docx': 'book/Graves decires de aguda intuición.docx',
            'pdf': 'book/Graves decires de aguda intuición.pdf (canonical visual reference)',
        },
        'traceability': 'SOURCE: BOOK. Verbatim text. '
                        'Unit = segment between explicit DOCX page breaks. '
                        'PDF pages inferred only via perceptual asset match.',
        'title': 'Graves decires de aguda intuición',
        'author_note': 'La poesía es de Ricardo Iorio / La prosa es mía (Germán Lahitte)',
        'unit_count': len(model_units),
        'units': model_units,
    }
    with open(r'data\book-model.json', 'w', encoding='utf-8') as f:
        json.dump(model, f, ensure_ascii=False, indent=2)
    print('units:', len(model_units))
    with_credits = sum(1 for u in model_units if u['song_credits'])
    print('units with song credits:', with_credits)
    print('total credits:', sum(len(u['song_credits']) for u in model_units))


if __name__ == '__main__':
    sys.exit(main())
