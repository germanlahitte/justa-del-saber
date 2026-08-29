"""Classify extracted assets and decode QR codes.

- Reads assets/docx-media/* without modifying them (in-memory analysis only).
- QR decoding via zxing-cpp and OpenCV detector (fallback), on unmodified pixels.
- Never generates, replaces, or normalizes QR content. Records literal values.

Output: data/asset-classification.json
SOURCE: ASSET (technical classification of BOOK assets).
"""
import json
import os
import sys

import cv2
import zxingcpp
from PIL import Image

INDIR = r'assets\docx-media'
OUT = r'data\asset-classification.json'


def decode_qr(path: str):
    """Try zxing-cpp first, then OpenCV. Returns (value, method) or (None, None)."""
    img = cv2.imread(path)
    if img is None:
        # Some PNGs may have alpha or palette; go through PIL
        pil = Image.open(path).convert('RGB')
        import numpy as np
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    results = zxingcpp.read_barcodes(img)
    for r in results:
        if r.valid:
            return r.text, f'zxing-cpp ({r.format})'
    det = cv2.QRCodeDetector()
    val, points, _ = det.detectAndDecode(img)
    if val:
        return val, 'opencv-QRCodeDetector'
    return None, None


def main() -> None:
    entries = []
    for name in sorted(os.listdir(INDIR)):
        path = os.path.join(INDIR, name)
        rec = {'file': name}
        try:
            with Image.open(path) as im:
                rec['format'] = im.format
                rec['width'], rec['height'] = im.size
                rec['mode'] = im.mode
        except Exception as e:  # noqa: BLE001
            rec['error'] = str(e)
            rec['classification'] = 'no-identificado'
            entries.append(rec)
            continue

        value, method = decode_qr(path)
        if value is not None:
            rec['classification'] = 'qr'
            rec['qr_value'] = value
            rec['qr_decode_method'] = method
            rec['qr_status'] = 'verified'
        else:
            # Heuristic: near-square, small, mostly black/white -> possible QR that failed
            with Image.open(path) as im:
                gray = im.convert('L')
                hist = gray.histogram()
                total = sum(hist)
                extremes = sum(hist[:32]) + sum(hist[224:])
                bw_ratio = extremes / total if total else 0
            square = abs(rec['width'] - rec['height']) <= max(rec['width'], rec['height']) * 0.15
            if square and bw_ratio > 0.9:
                rec['classification'] = 'posible-qr'
                rec['qr_status'] = 'unreadable'
            else:
                rec['classification'] = 'imagen-editorial'
        entries.append(rec)

    counts = {}
    for e in entries:
        counts[e['classification']] = counts.get(e['classification'], 0) + 1
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'counts': counts, 'assets': entries}, f, ensure_ascii=False, indent=2)
    print('counts:', counts)
    for e in entries:
        if e['classification'] in ('qr', 'posible-qr'):
            print(e['file'], '->', e.get('qr_value', 'UNREADABLE'))


if __name__ == '__main__':
    sys.exit(main())
