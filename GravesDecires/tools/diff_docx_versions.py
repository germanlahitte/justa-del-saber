"""Compare the OLD book-model.json (backed up before re-baseline) against a
freshly parsed view of the CURRENT (new) DOCX, at heading/paragraph level.
Read-only diagnostic — does not write anything.
"""
import json
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
DOCX = r'book\Graves decires de aguda intuición.docx'


def para_text(p):
    parts = []
    for node in p.iter():
        if node.tag == W + 't':
            parts.append(node.text or '')
        elif node.tag == W + 'br' and node.get(W + 'type') != 'page':
            parts.append('\n')
    return ''.join(parts)


def load_new_paragraphs():
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
        style = style_el.get(W + 'val') if style_el is not None else None
        imgs = []
        for blip in p.iter(A + 'blip'):
            rid = blip.get(R + 'embed')
            if rid:
                imgs.append(relmap.get(rid, '').split('/')[-1])
        pagebreak = any(b.get(W + 'type') == 'page' for b in p.iter(W + 'br'))
        paras.append({'index': len(paras), 'style': style, 'text': para_text(p),
                      'images': imgs, 'pagebreak': pagebreak})
    return paras


def main():
    old_model = json.load(open(r'data\_pre-rebaseline-backup\book-model.json', encoding='utf-8'))
    new_paras = load_new_paragraphs()

    print(f'NEW docx paragraph count: {len(new_paras)}')
    print(f'OLD book-model unit count: {old_model["unit_count"]}')

    # headings comparison
    new_headings = [(p['index'], p['style'], p['text'].strip()) for p in new_paras
                    if p['style'] in ('Title', 'Heading1', 'Heading2') and p['text'].strip()]
    print(f'\nNEW headings with text ({len(new_headings)}):')
    for idx, style, text in new_headings:
        print(f'  para {idx:4d} [{style:9s}] {text!r}')

    old_headings = []
    for u in old_model['units']:
        for h in u['headings']:
            old_headings.append((u['unit'], h))
    print(f'\nOLD headings (from book-model units, {len(old_headings)}):')
    for unit, h in old_headings:
        print(f'  unit {unit:3d}         {h!r}')

    # total word count comparison (rough, verbatim)
    new_word_count = sum(len(p['text'].split()) for p in new_paras)
    old_word_count = sum(len(u['text_verbatim'].split()) for u in old_model['units'])
    print(f'\nNEW total words (approx): {new_word_count}')
    print(f'OLD total words (approx): {old_word_count}')

    # image count
    new_img_count = sum(len(p['images']) for p in new_paras)
    print(f'\nNEW total embedded images: {new_img_count}')


if __name__ == '__main__':
    main()
