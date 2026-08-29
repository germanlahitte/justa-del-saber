"""Diagnostic: list every DOCX paragraph whose words were split across two
PDF pages, so a human can review fidelity of the split. Read-only.
"""
import json

pm = json.load(open(r'data\page-model.json', encoding='utf-8'))
seen = {}
for p in pm['pages']:
    for b in p['blocks']:
        if b['continues_from_previous_page'] or b['continues_on_next_page']:
            seen.setdefault(b['docx_paragraph_index'], []).append((p['page'], b))

for para_idx, entries in sorted(seen.items()):
    print(f'--- DOCX paragraph {para_idx} (book_unit {entries[0][1]["book_unit"]}) ---')
    for page, b in entries:
        flags = []
        if b['continues_from_previous_page']:
            flags.append('CONT-FROM-PREV')
        if b['continues_on_next_page']:
            flags.append('CONT-ON-NEXT')
        print(f'  page {page} [{" ".join(flags)}]: {b["text_verbatim_slice"]!r}')
    print()
