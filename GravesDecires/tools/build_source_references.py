"""Build data/source-references.json — the generalized SourceReference
entity (supersedes data/song-references.json / tools/build_song_references.py).

A QR in "Graves decires..." does not always point to a song. The correct
model is:

    SourceReference = external source a QR in the book points to.

    type: "song" | "interview" | "press-conference" | "video" |
          "declaration" | "other"

Fields by type:
  song:
    title, band, album, year, url, qr_asset, page, book_unit
  non-song (interview/press-conference/video/declaration/other):
    type, description (title/description), band/author/person, event/source,
    year, url, qr_asset, page, book_unit

Resolution rules (deterministic, nothing inferred):
  1. EDITORIAL asset-context.json entries re-resolved by SHA-256 content
     identity (Word renumbers embedded media on every DOCX re-save; see
     docs/web/BOOK-REBASELINE-v0.1.md §5). Supports both `song_ref` and the
     new generalized `source_ref` shape.
  2. BOOK printed song_credits on the same BookUnit (single credit -> use
     directly; multiple credits -> disambiguate by matching which credit's
     text sits on the SAME physical PDF page as the QR, via page-model.json).
  3. EDITORIAL song-credits.json (confidence: "editorial"), matched against
     the credited fragment's CURRENT physical page(s) (re-resolved via
     page-model.json, not a page number frozen at decision time).

If a QR cannot be resolved by any of the above, it is reported as
unresolved — never guessed.

SOURCE: BOOK + ASSET + EDITORIAL (derived, read-only over all of them).
"""
import json
import os

BOOK_MODEL = r'data\book-model.json'
PAGE_MODEL = r'data\page-model.json'
ASSETS_MANIFEST = r'data\assets-manifest.json'
ASSET_CONTEXT = r'data\editorial\asset-context.json'
SONG_CREDITS = r'data\editorial\song-credits.json'
HASH_DIFF = r'data\backups\_pre-rebaseline-v2-backup\asset-hash-diff.json'
# Last validated baseline. Source-references is a DERIVED artifact; when Word
# re-saves the DOCX it renumbers embedded media and can silently break the
# BOOK unit->asset association used to resolve a QR. The song identities are
# content-stable, so we fall back to the previous editorially-validated
# baseline ONLY if the song it names still exists as a printed credit in the
# CURRENT book-model. Deterministic; never guesses a new song.
PREV_SOURCE_REFS = r'data\backups\_pre-rebaseline-v3-backup\source-references.json'
OUT = r'data\source-references.json'
REPORT = r'data\backups\_pre-rebaseline-v2-backup\source-references-report.txt'


def build_asset_id_remap():
    """old_asset_id (as referenced by pre-rebaseline EDITORIAL files) ->
    current_asset_id (same content, current identity), via SHA-256."""
    old_manifest = json.load(open(r'data\backups\_pre-rebaseline-backup\assets-manifest.json', encoding='utf-8'))
    new_manifest = json.load(open(ASSETS_MANIFEST, encoding='utf-8'))
    new_by_sha = {a['sha256']: a['id'] for a in new_manifest['assets']}
    old_by_id = {a['id']: a for a in old_manifest['assets']}

    remap = {}
    for old_id, old_asset in old_by_id.items():
        current_id = new_by_sha.get(old_asset['sha256'])
        if current_id:
            remap[old_id] = current_id
    return remap


def normalize_editorial_entry(entry: dict, credit_range_by_key: dict) -> dict | None:
    """Turn one asset-context.json entry into a generic SourceReference
    payload (type + type-specific fields), regardless of whether it used
    the legacy `song_ref` shape or the new generalized `source_ref` shape.
    Returns None for entries that don't describe an external source (e.g.
    plain descriptive-context photos).

    For `type: song`, also attach `credit_paragraph_range` by looking up
    the EXACT (title, band, album, year) key against BOOK's printed
    credits (Problem #2 fix) — deterministic identity match, never a
    generic textual/proximity guess."""
    accompanies = entry['resolved_accompanies']
    kind = accompanies.get('type')

    if kind == 'song' and accompanies.get('song_ref'):
        s = accompanies['song_ref']
        key = (s['title'], s['band'], s['album'], s['year'])
        return {
            'type': 'song',
            'title': s['title'],
            'band': s['band'],
            'album': s['album'],
            'year': s['year'],
            'decision_id': entry['decision_id'],
            'credit_paragraph_range': credit_range_by_key.get(key),
        }

    if accompanies.get('source_ref'):
        s = accompanies['source_ref']
        return {
            'type': kind,
            'description': s.get('description'),
            'band': s.get('band'),
            'author': s.get('author'),
            'person': s.get('person'),
            'event': s.get('event'),
            'year': s.get('year'),
            'decision_id': entry['decision_id'],
        }

    return None


def main():
    book_model = json.load(open(BOOK_MODEL, encoding='utf-8'))
    page_model = json.load(open(PAGE_MODEL, encoding='utf-8'))
    manifest = json.load(open(ASSETS_MANIFEST, encoding='utf-8'))
    asset_context = json.load(open(ASSET_CONTEXT, encoding='utf-8'))
    song_credits_editorial = json.load(open(SONG_CREDITS, encoding='utf-8'))
    asset_id_remap = build_asset_id_remap()
    sha_by_new_id = {a['id']: a['sha256'] for a in manifest['assets']}

    pages_by_no = {p['page']: p for p in page_model['pages']}

    # exact (title, band, album, year) -> credit_paragraph_range, built from
    # BOOK's own printed credits — used to deterministically attach the
    # credit block location to EDITORIAL song overrides too (DEC-01..04),
    # since those songs DO have a printed credit in the book; the QR was
    # just ambiguous between two on the same page, not uncredited.
    credit_range_by_key = {}
    for u in book_model['units']:
        for c in u['song_credits']:
            key = (c['song_title'], c['band'], c['album'], c['year'])
            if c.get('credit_paragraph_range'):
                credit_range_by_key[key] = c['credit_paragraph_range']

    # 1) resolve EDITORIAL asset-context.json entries against CURRENT asset
    #    identity. Two addressing modes are supported:
    #      - legacy entries: `asset_id` (resolved via the old->new SHA-256
    #        remap table built from the pre-rebaseline manifest backup)
    #      - new entries (DEC-13+): `asset_sha256` directly, immune to any
    #        future filename renumbering by construction
    editorial_by_current_asset_id = {}
    unresolved_remaps = []
    for entry in asset_context['asset_context']:
        if entry.get('status') == 'superseded-by-book-rebaseline':
            continue
        current_asset_id = None
        if 'asset_sha256' in entry:
            current_asset_id = next(
                (aid for aid, sha in sha_by_new_id.items() if sha == entry['asset_sha256']),
                None,
            )
        else:
            current_asset_id = asset_id_remap.get(entry['asset_id'])
        if current_asset_id is None:
            unresolved_remaps.append(entry['id'])
            continue
        normalized = normalize_editorial_entry(entry, credit_range_by_key)
        if normalized:
            editorial_by_current_asset_id[current_asset_id] = normalized

    # 2) BookUnit -> printed song_credits (BOOK). See build_song_references.py
    #    history for why page-level disambiguation is required when a unit
    #    carries multiple credits.
    printed_credits_by_unit = {}
    for u in book_model['units']:
        if u['song_credits']:
            printed_credits_by_unit[u['unit']] = u['song_credits']

    def credit_on_same_page(pdf_page: int, candidates: list[dict]) -> dict | None:
        page = pages_by_no.get(pdf_page)
        if not page:
            return None
        page_text = ' '.join(b['text_verbatim_slice'] for b in page['blocks'])
        matches = [c for c in candidates if c['song_title'] in page_text and c['band'] in page_text]
        return matches[0] if len(matches) == 1 else None

    # 3) EDITORIAL song-credits.json, matched against the credited
    #    fragment's CURRENT physical page(s).
    editorial_credits_by_unit = {}
    for sc in song_credits_editorial['song_credits']:
        unit_no = int(sc['fragment_ref']['book_unit_id'].replace('unit-', ''))
        para_lo, para_hi = sc['fragment_ref']['docx_paragraph_range']
        current_pages = sorted({
            p['page'] for p in page_model['pages']
            for b in p['blocks']
            if para_lo <= b['docx_paragraph_index'] <= para_hi
        })
        editorial_credits_by_unit[unit_no] = {
            'song_ref': sc['song_ref'],
            'current_fragment_pages': current_pages,
        }

    # 4) walk every QR asset and resolve.
    unresolved = []
    references = []
    seen_song_keys = set()

    # Previous validated baseline, keyed by qr_asset_id, plus the set of
    # (title, band) pairs still printed as credits in the CURRENT book-model.
    prev_refs_by_asset_id = {}
    if os.path.exists(PREV_SOURCE_REFS):
        prev = json.load(open(PREV_SOURCE_REFS, encoding='utf-8'))
        prev_refs_by_asset_id = {
            r['qr_asset_id']: r['source_ref'] for r in prev['references']
            if r['source_ref'] is not None
        }
    current_song_credit_keys = {(t, b) for (t, b, _a, _y) in credit_range_by_key.keys()}

    for asset in manifest['assets']:
        if asset['type'] != 'qr':
            continue
        aid = asset['id']
        pdf_page = asset['pdf_page']
        owning_units = [u['unit'] for u in book_model['units']
                        if any(a['asset_id'] == aid for a in u['assets'])]

        source_ref = None
        source = None

        if aid in editorial_by_current_asset_id:
            source_ref = editorial_by_current_asset_id[aid]
            source = 'EDITORIAL (asset-context, re-resolved by content identity)'
        else:
            for unit in owning_units:
                candidates = printed_credits_by_unit.get(unit)
                if not candidates:
                    continue
                if len(candidates) == 1:
                    c = candidates[0]
                    source_ref = {'type': 'song', 'title': c['song_title'], 'band': c['band'],
                                  'album': c['album'], 'year': c['year'], 'decision_id': None,
                                  'credit_paragraph_range': c.get('credit_paragraph_range')}
                    source = 'BOOK (printed credit, same unit, single credit)'
                    break
                c = credit_on_same_page(pdf_page, candidates)
                if c:
                    source_ref = {'type': 'song', 'title': c['song_title'], 'band': c['band'],
                                  'album': c['album'], 'year': c['year'], 'decision_id': None,
                                  'credit_paragraph_range': c.get('credit_paragraph_range')}
                    source = 'BOOK (printed credit, disambiguated by same PDF page)'
                    break
            if source_ref is None:
                for unit in owning_units:
                    editorial = editorial_credits_by_unit.get(unit)
                    if not editorial:
                        continue
                    if pdf_page in editorial['current_fragment_pages']:
                        s = editorial['song_ref']
                        source_ref = {'type': 'song', 'title': s['title'], 'band': s['band'],
                                      'album': s['album'], 'year': s['year'], 'decision_id': None}
                        source = 'EDITORIAL (song-credits.json, QR shares a page with the credited fragment)'
                        break

            # 4b) FALLBACK: restore the previous editorially-validated baseline
            #     ONLY when the song it names still exists in the current
            #     BOOK credits (content-stable identity). Covers the DOCX
            #     media-renumbering case where the unit->asset association is
            #     silently broken by a Word re-save but the song is unchanged.
            if source_ref is None:
                prev = prev_refs_by_asset_id.get(aid)
                if prev and prev.get('type') == 'song':
                    key = (prev['title'], prev['band'])
                    if key in current_song_credit_keys:
                        source_ref = {'type': 'song', 'title': prev['title'], 'band': prev['band'],
                                      'album': prev['album'], 'year': prev['year'], 'decision_id': None,
                                      'credit_paragraph_range': credit_range_by_key.get(key)}
                        source = 'RESTORED (previous validated baseline; song still a printed credit in THIS book-model)'


        entry = {
            'qr_asset_id': aid,
            'qr_value': asset.get('qr_value'),
            'pdf_page': pdf_page,
            'book_units': owning_units,
            'source_ref': source_ref,
            'resolution_source': source,
        }
        if source_ref is None:
            unresolved.append(entry)
        else:
            if source_ref['type'] == 'song':
                seen_song_keys.add((source_ref['title'], source_ref['band']))
        references.append(entry)

    # 5) songs with a credit in BOOK/EDITORIAL but no QR at all (report only)
    all_song_keys_from_credits = set()
    for unit, credits in printed_credits_by_unit.items():
        for c in credits:
            all_song_keys_from_credits.add((c['song_title'], c['band']))
    for unit, editorial in editorial_credits_by_unit.items():
        s = editorial['song_ref']
        all_song_keys_from_credits.add((s['title'], s['band']))
    songs_without_qr = sorted(all_song_keys_from_credits - seen_song_keys)

    resolved_count = sum(1 for r in references if r['source_ref'])
    by_type = {}
    for r in references:
        if r['source_ref']:
            by_type[r['source_ref']['type']] = by_type.get(r['source_ref']['type'], 0) + 1

    result = {
        'source': 'BOOK + ASSET + EDITORIAL (derived, read-only)',
        'model': 'SourceReference — generalized entity for any external '
                 'source a QR in the book points to (song, interview, '
                 'press-conference, video, declaration, other). Replaces '
                 'the earlier SongReference model (data/song-references.json, '
                 'retired) which incorrectly assumed every QR was a song.',
        'note': 'Editorial overrides are resolved by SHA-256 content '
                'identity (legacy entries via asset_id + a saved old->new '
                'remap table; DEC-13+ entries via asset_sha256 directly), '
                'never by DOCX-internal filename, which Word renumbers on '
                'every re-save.',
        'total_qr_assets': sum(1 for a in manifest['assets'] if a['type'] == 'qr'),
        'resolved_count': resolved_count,
        'unresolved_count': len(unresolved),
        'resolved_by_type': by_type,
        'unresolved_asset_id_remaps': unresolved_remaps,
        'songs_with_credit_but_no_qr': [{'title': t, 'band': b} for t, b in songs_without_qr],
        'references': references,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    lines = []
    lines.append(f'Total QR assets: {result["total_qr_assets"]}')
    lines.append(f'Resolved SourceReferences: {resolved_count} / {result["total_qr_assets"]}')
    lines.append(f'By type: {by_type}')
    lines.append(f'Unresolved: {result["unresolved_count"]}')
    if unresolved_remaps:
        lines.append(f'\nUnresolved asset_id/sha256 remaps: {len(unresolved_remaps)}')
        for u in unresolved_remaps:
            lines.append(f'  - {u}')
    if songs_without_qr:
        lines.append(f'\nSongs with a credit but NO QR found: {len(songs_without_qr)}')
        for t, b in songs_without_qr:
            lines.append(f'  - {t} ({b})')
    if unresolved:
        lines.append('\nUnresolved QR references:')
        for u in unresolved:
            lines.append(f'  - {u["qr_asset_id"]} (page {u["pdf_page"]}, units {u["book_units"]})')

    report = '\n'.join(lines)
    with open(REPORT, 'w', encoding='utf-8') as f:
        f.write(report)
    print(report)


if __name__ == '__main__':
    main()
