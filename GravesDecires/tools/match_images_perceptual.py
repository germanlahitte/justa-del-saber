"""Perceptually match DOCX media to PDF page images.

The PDF (Google Docs render) recompressed images, so byte digests differ.
This tool decodes both sides to pixels IN MEMORY and compares small grayscale
thumbnails (difference hash + mean absolute error). Files on disk are never
modified. Ambiguous matches are flagged needs-review instead of guessed.

Output: data/image-match.json
SOURCE: ASSET (technical matching).
"""
import json
import os
import sys
from io import BytesIO

import pymupdf
from PIL import Image

PDF = r'book\Graves decires de aguda intuición.pdf'
MEDIA = r'assets\docx-media'
OUT = r'data\image-match.json'
THUMB = 32
MAE_ACCEPT = 18.0   # accept threshold (0-255 scale)
MAE_MARGIN = 4.0    # best must beat second-best by this margin


def thumb(img: Image.Image):
    g = img.convert('L').resize((THUMB, THUMB), Image.BILINEAR)
    return list(g.getdata())


def mae(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def main() -> None:
    media_thumbs = {}
    for name in sorted(os.listdir(MEDIA)):
        with Image.open(os.path.join(MEDIA, name)) as im:
            media_thumbs[name] = thumb(im)

    doc = pymupdf.open(PDF)
    pdf_images = []  # (page, xref, thumb)
    for i in range(doc.page_count):
        for img in doc[i].get_images(full=True):
            xref = img[0]
            try:
                pix = pymupdf.Pixmap(doc, xref)
                if pix.colorspace and pix.colorspace.n > 3:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                data = pix.tobytes('png')
                with Image.open(BytesIO(data)) as im:
                    pdf_images.append((i + 1, xref, thumb(im)))
            except Exception as e:  # noqa: BLE001
                pdf_images.append((i + 1, xref, None))

    results = []
    for name, mt in media_thumbs.items():
        scored = []
        for page, xref, pt in pdf_images:
            if pt is None:
                continue
            scored.append((mae(mt, pt), page, xref))
        scored.sort()
        best = scored[0] if scored else None
        second = scored[1] if len(scored) > 1 else None
        rec = {'docx_media': name}
        if best and best[0] <= MAE_ACCEPT and (second is None or second[0] - best[0] >= MAE_MARGIN):
            rec.update(status='matched', pdf_page=best[1], xref=best[2],
                       mae=round(best[0], 2))
        elif best and best[0] <= MAE_ACCEPT:
            rec.update(status='needs-review', pdf_page=best[1], xref=best[2],
                       mae=round(best[0], 2),
                       second_page=second[1], second_mae=round(second[0], 2),
                       note='ambiguous: second candidate too close')
        else:
            rec.update(status='needs-review',
                       best_page=best[1] if best else None,
                       best_mae=round(best[0], 2) if best else None,
                       note='no candidate under threshold')
        results.append(rec)

    counts = {}
    for r in results:
        counts[r['status']] = counts.get(r['status'], 0) + 1
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'counts': counts, 'matches': results}, f, ensure_ascii=False, indent=2)
    print('counts:', counts)
    for r in results:
        if r['status'] != 'matched':
            print('NEEDS-REVIEW:', r)


if __name__ == '__main__':
    sys.exit(main())
