"""Verification: reconstructing all pages in order and concatenating every
block's text_verbatim_slice must reproduce the exact same word sequence as
the original DOCX paragraphs (module tools/build_page_model.py), proving no
words were dropped, duplicated, or reordered by the page-splitting logic.
Read-only.
"""
import json
import re
import zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
DOCX = r'book\Graves decires de aguda intuición.docx'


def norm_words(text: str) -> list[str]:
    text = text.replace('\u200b', ' ').replace('\xa0', ' ')
    text = re.sub(r'[""«»]', '"', text)
    text = re.sub(r"[''´`]", "'", text)
    text = re.sub(r'[–—]', '-', text)
    return re.findall(r'\S+', text)


def para_text(p) -> str:
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
    body = doc.find(W + 'body')
    original_words_by_para: dict[int, list[str]] = {}
    idx = 0
    for p in body:
        if p.tag != W + 'p':
            continue
        original_words_by_para[idx] = norm_words(para_text(p))
        idx += 1

    pm = json.load(open(r'data\page-model.json', encoding='utf-8'))
    reconstructed: dict[int, list[str]] = {}
    for page in pm['pages']:
        for b in page['blocks']:
            pi = b['docx_paragraph_index']
            # text_verbatim_slice now preserves the ORIGINAL glyphs (real
            # em-dash, real \n — Problem #3 fix), so normalize the same way
            # as the "original" side below before comparing tokens; this is
            # apples-to-apples verification of word IDENTITY, not a claim
            # that the stored slice itself is normalized (it isn't — it's
            # verbatim, which is the whole point).
            reconstructed.setdefault(pi, []).extend(norm_words(b['text_verbatim_slice']))

    mismatches = []
    for pi, original in original_words_by_para.items():
        if pi not in reconstructed:
            if original:  # a paragraph with real words must appear somewhere
                mismatches.append((pi, 'MISSING ENTIRELY', original[:10], []))
            continue
        got = reconstructed[pi]
        if got != original:
            mismatches.append((pi, 'MISMATCH', original, got))

    print(f'paragraphs checked: {len(original_words_by_para)}')
    print(f'mismatches: {len(mismatches)}')
    for pi, kind, orig, got in mismatches[:20]:
        print(f'  para {pi} [{kind}]')
        print(f'    original: {" ".join(orig)[:150]!r}')
        print(f'    got     : {" ".join(got)[:150]!r}')

    if not mismatches:
        print('VERIFICATION PASSED: every DOCX paragraph word sequence is '
              'reproduced exactly across the derived pages (no loss, no '
              'duplication, no reordering).')


if __name__ == '__main__':
    main()
