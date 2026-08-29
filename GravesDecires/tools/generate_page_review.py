"""Generate docs/web/PAGE-REVIEW-v0.1.md — one section per physical page
(1..79) with ONLY factual, derivable metadata precompleted:
  - page number
  - heading/section (from the merged TOC, same rule as web/src/lib/pageIndex.ts)
  - layout (default | band-role | blank | visual-only)
  - SourceReferences present

No aesthetic critique or observation is generated. Each section ends with
an empty "Observaciones" list and "Estado: PENDIENTE", for manual editorial
review.

Read-only over all canonical/derived data sources.
"""
import json

PAGE_MODEL = r'data\page-model.json'
PRESENTATION = r'data\editorial\page-presentation.json'
BOOK_INDEX = r'data\editorial\book-index.json'
SOURCE_REFS = r'data\source-references.json'
OUT = r'docs\web\PAGE-REVIEW-v0.1.md'


def merge_heading_runs(blocks):
    """Same rule as web/src/lib/pageIndex.ts mergeHeadingRuns(): consecutive
    (by docx paragraph index) heading-styled blocks landing on the SAME
    page are one semantic heading."""
    sorted_blocks = sorted(blocks, key=lambda b: b['docx_paragraph_index'])
    runs = []
    run = []
    for b in sorted_blocks:
        if run and b['docx_paragraph_index'] == run[-1]['docx_paragraph_index'] + 1:
            run.append(b)
        else:
            if run:
                runs.append(run)
            run = [b]
    if run:
        runs.append(run)
    return [' '.join(x['text_verbatim_slice'].strip() for x in r).replace('  ', ' ').strip()
            for r in runs]


def main():
    pm = json.load(open(PAGE_MODEL, encoding='utf-8'))
    presentation = json.load(open(PRESENTATION, encoding='utf-8'))
    book_index = json.load(open(BOOK_INDEX, encoding='utf-8'))
    source_refs = json.load(open(SOURCE_REFS, encoding='utf-8'))

    presentation_by_page = {p['page']: p for p in presentation['pages']}
    editorial_label_by_page = {e['page']: e['label'] for e in book_index['entries']}
    refs_by_page = {}
    for r in source_refs['references']:
        refs_by_page.setdefault(r['pdf_page'], []).append(r)

    # pages that have a real heading (used to decide if editorial label
    # should be shown instead, matching pageIndex.ts logic)
    pages_with_heading = set()
    heading_text_by_page = {}
    for p in pm['pages']:
        heading_blocks = [b for b in p['blocks']
                          if b['style'] in ('Title', 'Heading1', 'Heading2')
                          and b['text_verbatim_slice'].strip()]
        if heading_blocks:
            pages_with_heading.add(p['page'])
            heading_text_by_page[p['page']] = ' / '.join(merge_heading_runs(heading_blocks))

    lines = []
    lines.append('# Graves decires — Revisión editorial página por página v0.1')
    lines.append('')
    lines.append('**Propósito:** revisión manual, página por página, del MODO LEER.')
    lines.append('Solo contiene metadata factual precompletada (heading/sección, layout,')
    lines.append('SourceReferences). Ninguna observación fue generada automáticamente —')
    lines.append('completalas vos mismo debajo de cada página.')
    lines.append('')
    lines.append('**Cómo revisar:** navegá `http://localhost:4321/libro/p/N` para cada')
    lines.append('página y anotá tus observaciones en la sección correspondiente.')
    lines.append('')
    lines.append('---')
    lines.append('')

    for page_no in range(1, pm['page_count'] + 1):
        p = next(pg for pg in pm['pages'] if pg['page'] == page_no)

        # layout
        if page_no in presentation_by_page:
            layout = presentation_by_page[page_no]['layout']
        elif p['is_blank_or_folio_only']:
            layout = 'blank'
        elif p['is_visual_only']:
            layout = 'visual-only'
        else:
            layout = 'default'

        # heading/section
        if page_no in pages_with_heading:
            section = heading_text_by_page[page_no]
            section_source = 'BOOK'
        elif page_no in editorial_label_by_page:
            section = editorial_label_by_page[page_no]
            section_source = 'EDITORIAL'
        else:
            section = None
            section_source = None

        refs = refs_by_page.get(page_no, [])

        lines.append(f'## Página {page_no}')
        lines.append('')
        lines.append('Estado: PENDIENTE')
        lines.append('')
        lines.append('**Metadata:**')
        if section:
            lines.append(f'- Heading/sección: {section} _(fuente: {section_source})_')
        else:
            lines.append('- Heading/sección: (sin heading ni etiqueta editorial)')
        lines.append(f'- Layout: `{layout}`')
        if refs:
            for r in refs:
                sref = r.get('source_ref')
                if sref:
                    if sref['type'] == 'song':
                        desc = f"{sref['title']} — {sref['band']}, {sref['album']} ({sref['year']})"
                    else:
                        desc = sref.get('description') or f"[{sref['type']}]"
                    lines.append(f"- SourceReference: {desc} _(type: {sref['type']})_")
                else:
                    lines.append(f"- SourceReference: sin resolver ({r['qr_asset_id']})")
        else:
            lines.append('- SourceReference: (ninguna en esta página)')
        lines.append('')
        lines.append('**Observaciones:**')
        lines.append('- ')
        lines.append('')
        lines.append('---')
        lines.append('')

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f'Generated {OUT} with {pm["page_count"]} page sections.')


if __name__ == '__main__':
    main()
