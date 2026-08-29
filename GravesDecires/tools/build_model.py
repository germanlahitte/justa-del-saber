"""Build the structured book model and the assets manifest.

Combines:
- DOCX paragraph structure (data/docx-structure.txt regenerated in-memory here)
- Asset classification + QR values (data/asset-classification.json)
- Perceptual PDF page match (data/image-match.json)
- Extraction log (data/extraction-log.json)

Rules honored:
- Text is copied verbatim from the DOCX (never rewritten).
- No metadata is invented: song credits are detected only when the exact
  credit pattern (title / album - year / band) exists in the source.
- Anything ambiguous is marked NEEDS-REVIEW / UNKNOWN.

Outputs: data/book-model.json, data/assets-manifest.json
SOURCE: BOOK (model), ASSET (manifest).
"""
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


def load_paragraphs():
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
        style = style_el.get(W + 'val') if style_el is not None else ''
        text = ''.join(t.text or '' for t in p.iter(W + 't'))
        imgs = []
        for blip in p.iter(A + 'blip'):
            rid = blip.get(R + 'embed')
            if rid:
                target = relmap.get(rid, '')
                imgs.append(target.split('/')[-1])
        pagebreak = any(b.get(W + 'type') == 'page' for b in p.iter(W + 'br'))
        paras.append({'i': len(paras), 'style': style, 'text': text,
                      'images': imgs, 'pagebreak': pagebreak})
    return paras


def main() -> None:
    paras = load_paragraphs()
    classification = json.load(open(r'data\asset-classification.json', encoding='utf-8'))
    match = json.load(open(r'data\image-match.json', encoding='utf-8'))
    extraction = json.load(open(r'data\extraction-log.json', encoding='utf-8'))

    # ------------------------------------------------------------------
    # SHA-FIRST IDENTITY (canonical). Word renumbers embedded media
    # (image1.png -> image48.png) and can swap .png/.jpg on every re-save,
    # so a DOCX-internal filename is NEVER asset identity. The canonical
    # identity is asset_id <-> sha256. We load the previous manifest (the
    # sound {sha256 -> asset_id} table) read-only and rebind each V3 media
    # file by its SHA-256 content, so asset_imageN keeps its canonical
    # meaning (Se vos, Antes que los Viejos Reyes, ...) no matter what
    # filename or extension this DOCX version happens to use.
    # ------------------------------------------------------------------
    PREV_MANIFEST_PATH = r'data\assets-manifest.json'
    try:
        prev_manifest = json.load(open(PREV_MANIFEST_PATH, encoding='utf-8'))
        id_by_sha = {a['sha256']: a['id'] for a in prev_manifest['assets']}
    except (FileNotFoundError, KeyError):
        # No prior canonical table: fall back to filename-derived ids and
        # flag them; every asset is then audited as NEEDS-REVIEW for identity.
        id_by_sha = {}

    cls_by_file = {a['file']: a for a in classification['assets']}
    # Perceptual page match, resolved through the media's SHA-256 (never the
    # filename). extraction-log gives name -> sha; image-match gives
    # name -> pdf_page; combine to name -> sha -> pdf_page.
    sha_by_file = {f['extracted_file'].split('/')[-1]: f['sha256'] for f in extraction['files']}
    page_by_file = {m['docx_media']: m.get('pdf_page') for m in match['matches']}
    page_by_sha = {
        sha_by_file[name]: page
        for name, page in page_by_file.items()
        if page is not None and name in sha_by_file
    }
    docxpath_by_file = {f['extracted_file'].split('/')[-1]: f['original_path_in_docx']
                        for f in extraction['files']}

    # --- detect song credit blocks: band line preceded by "Album - Year" preceded by title
    songs = []
    nonempty = [p for p in paras if p['text'].strip() or p['images']]
    for idx, p in enumerate(paras):
        if p['text'].strip() in BANDS:
            # walk back over blank lines
            j = idx - 1
            while j >= 0 and not paras[j]['text'].strip():
                j -= 1
            m = CREDIT_RE.match(paras[j]['text'].strip()) if j >= 0 else None
            if not m:
                continue
            k = j - 1
            while k >= 0 and not paras[k]['text'].strip():
                k -= 1
            title = paras[k]['text'].strip() if k >= 0 else 'UNKNOWN'
            songs.append({
                'title': title,
                'album': m.group(1).strip(),
                'year': int(m.group(2)),
                'band': p['text'].strip(),
                'credit_para_range': [k, idx],
            })

    # --- chapter boundaries (from Heading2/Title runs with text)
    chapters = []
    for p in paras:
        if p['style'] in ('Heading2',) and p['text'].strip():
            chapters.append({'para': p['i'], 'heading': p['text'].strip()})

    # --- associate each media file to nearest song credit block (search window)
    def song_for_para(i):
        best = None
        for s in songs:
            k, idx = s['credit_para_range']
            # image anchored within the block [title-40, credit+6]
            if k - 45 <= i <= idx + 8:
                dist = min(abs(i - k), abs(i - idx))
                if best is None or dist < best[0]:
                    best = (dist, s)
        return best[1] if best else None

    img_context = {}
    for p in paras:
        for img in p['images']:
            s = song_for_para(p['i'])
            img_context[img] = {
                'anchor_para': p['i'],
                'song': f"{s['title']} ({s['band']})" if s else None,
            }

    # --- assets manifest
    assets = []
    for name in sorted(cls_by_file):
        c = cls_by_file[name]
        ctx = img_context.get(name, {})
        qr = c.get('classification') == 'qr'
        sha = sha_by_file.get(name, 'UNKNOWN')
        # Canonical identity via SHA-256. If a V3 media file's bytes match a
        # known canonical asset, we keep that asset_id and the real V3
        # filename/path as traceability. A sha with no canonical id is a
        # hard ambiguity: stop rather than guess (Gate 1).
        cid = id_by_sha.get(sha)
        if cid is None:
            raise SystemExit(
                f'AMBIGUITY: media file {name!r} (sha256={sha}) has no canonical '
                f'asset_id. Refusing to infer identity by filename. Fix the '
                f'canonical id_by_sha table first.'
            )
        asset = {
            'id': cid,
            'extracted_file': f'assets/docx-media/{name}',
            'original_path_in_docx': docxpath_by_file.get(name, 'UNKNOWN'),
            'sha256': sha,
            'type': c['classification'],
            'format': c.get('format'),
            'dimensions': f"{c.get('width')}x{c.get('height')}",
            'pdf_page': page_by_sha.get(sha, 'UNKNOWN'),
            'pdf_page_match': 'perceptual (mae<=0.5)',
            'docx_anchor_paragraph': ctx.get('anchor_para', 'UNKNOWN'),
            'accompanies': ctx.get('song') or 'NEEDS-REVIEW',
        }
        if qr:
            asset['qr_value'] = c['qr_value']
            asset['qr_decode_method'] = c['qr_decode_method']
            asset['qr_status'] = 'verified'
        assets.append(asset)

    manifest = {
        'source': {
            'docx': DOCX.replace('\\', '/'),
            'pdf': 'book/Graves decires de aguda intuición.pdf',
        },
        'generated_by': 'tools/build_model.py',
        'traceability': 'SOURCE: BOOK/ASSET only. No generated or replaced assets.',
        'counts': {
            'total': len(assets),
            'qr': sum(1 for a in assets if a['type'] == 'qr'),
            'imagen_editorial': sum(1 for a in assets if a['type'] == 'imagen-editorial'),
        },
        'assets': assets,
    }
    with open(r'data\assets-manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # --- book model: sequential nodes with verbatim text
    model = {
        'source': manifest['source'],
        'note': 'Verbatim structural model. Text copied from DOCX without edits. '
                'PDF is the canonical visual reference.',
        'songs_detected': songs,
        'chapters_detected': chapters,
    }
    with open(r'data\book-model-index.json', 'w', encoding='utf-8') as f:
        json.dump(model, f, ensure_ascii=False, indent=2)

    print('songs detected:', len(songs))
    for s in songs:
        print(f"  {s['title']}  |  {s['album']} - {s['year']}  |  {s['band']}")
    print('chapters (Heading2 with text):')
    for c in chapters:
        print(f"  para {c['para']}: {c['heading']}")
    unassigned = [a['extracted_file'] for a in assets if a['accompanies'] == 'NEEDS-REVIEW']
    print('assets without song association:', len(unassigned))
    for u in unassigned:
        print('  ', u)


if __name__ == '__main__':
    sys.exit(main())
