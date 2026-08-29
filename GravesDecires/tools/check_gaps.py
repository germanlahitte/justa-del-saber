"""Inspect QR-song association details for gap songs. Read-only. SOURCE: ASSET."""
import json

m = json.load(open(r'data\assets-manifest.json', encoding='utf-8'))
for a in sorted(m['assets'], key=lambda x: (x['pdf_page'] if isinstance(x['pdf_page'], int) else 999)):
    print(f"p{a['pdf_page']!s:>3} | {a['extracted_file'].split('/')[-1]:14s} | {a['type']:16s} | "
          f"para {a['docx_anchor_paragraph']!s:>4} | {a['accompanies']}")
