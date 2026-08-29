"""Inspect DOCX structure: paragraphs, styles, embedded image anchors, page breaks.

Read-only over the source DOCX. Output: data/docx-structure.txt
SOURCE: BOOK (structural dump, no content rewriting).
"""
import sys
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

DOCX = r'book\Graves decires de aguda intuición.docx'
OUT = r'data\docx-structure.txt'


def main() -> None:
    z = zipfile.ZipFile(DOCX)
    doc = ET.fromstring(z.read('word/document.xml'))
    rels = ET.fromstring(z.read('word/_rels/document.xml.rels'))
    relmap = {rel.get('Id'): rel.get('Target') for rel in rels}

    body = doc.find(W + 'body')
    lines = []
    styles = set()
    for i, p in enumerate(body):
        tag = p.tag.split('}')[1]
        if tag != 'p':
            lines.append(f'{i:4d} | <{tag.upper()}> |')
            continue
        style_el = p.find(W + 'pPr/' + W + 'pStyle')
        style = style_el.get(W + 'val') if style_el is not None else ''
        if style:
            styles.add(style)
        text = ''.join(t.text or '' for t in p.iter(W + 't'))
        imgs = []
        for blip in p.iter(A + 'blip'):
            rid = blip.get(R + 'embed')
            if rid:
                imgs.append(relmap.get(rid, rid))
        brs = [b for b in p.iter(W + 'br') if b.get(W + 'type') == 'page']
        marker = ''
        if imgs:
            marker += ' [IMG: ' + ','.join(imgs) + ']'
        if brs:
            marker += f' [PAGEBREAK x{len(brs)}]'
        lines.append(f'{i:4d} | {style:14s} | {text}{marker}')

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('paragraph-level entries:', len(lines))
    print('styles used:', sorted(styles))
    print('written to', OUT)


if __name__ == '__main__':
    sys.exit(main())
