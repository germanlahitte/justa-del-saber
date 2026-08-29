"""Extract embedded media from the DOCX preserving original bytes.

- Byte-for-byte copies (no recompression, no resizing, no conversion).
- Keeps original filename from word/media/ for traceability.
- Records sha256 of each original file.

Output: assets/docx-media/<original-name> + data/extraction-log.json
SOURCE: BOOK (asset extraction only).
"""
import hashlib
import json
import os
import sys
import zipfile

DOCX = r'book\Graves decires de aguda intuición.docx'
OUTDIR = r'assets\docx-media'
LOG = r'data\extraction-log.json'


def main() -> None:
    # Clean the output dir first: Word renumbers embedded media (image1.png,
    # image2.png, ...) whenever the DOCX is re-saved, so a stale file left
    # over from a previous extraction could silently keep old bytes under a
    # name that the new DOCX also happens to use, corrupting traceability.
    if os.path.isdir(OUTDIR):
        for name in os.listdir(OUTDIR):
            os.remove(os.path.join(OUTDIR, name))
    else:
        os.makedirs(OUTDIR, exist_ok=True)
    z = zipfile.ZipFile(DOCX)
    entries = []
    for info in z.infolist():
        if not info.filename.startswith('word/media/'):
            continue
        name = os.path.basename(info.filename)
        raw = z.read(info.filename)
        dest = os.path.join(OUTDIR, name)
        with open(dest, 'wb') as f:
            f.write(raw)
        entries.append({
            'original_path_in_docx': info.filename,
            'extracted_file': dest.replace('\\', '/'),
            'size_bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(),
        })
    entries.sort(key=lambda e: e['original_path_in_docx'])
    with open(LOG, 'w', encoding='utf-8') as f:
        json.dump({'source_docx': DOCX, 'count': len(entries), 'files': entries}, f,
                  ensure_ascii=False, indent=2)
    print(f'extracted {len(entries)} files to {OUTDIR}')


if __name__ == '__main__':
    sys.exit(main())
