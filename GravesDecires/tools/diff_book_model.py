"""Compare OLD vs NEW data/book-model.json unit-by-unit.

Checks:
- unit count match
- per-unit docx_paragraph_range match
- per-unit text_verbatim match (word-for-word, ignoring only whitespace)
- per-unit headings match
- per-unit song_credits match
- per-unit asset list match (by asset content identity via rename map, not
  by raw filename, since Word renumbers embedded media on re-save)

Read-only. Writes a JSON + human report; does not touch any canonical file.
"""
import json

OLD = r'data\_pre-rebaseline-v2-backup\book-model.json'
NEW = r'data\book-model.json'
RENAME_DIFF = r'data\_pre-rebaseline-v2-backup\asset-hash-diff.json'
OUT = r'data\_pre-rebaseline-v2-backup\book-model-diff-report.txt'


def main():
    old = json.load(open(OLD, encoding='utf-8'))
    new = json.load(open(NEW, encoding='utf-8'))
    rename = json.load(open(RENAME_DIFF, encoding='utf-8'))
    # old_id -> new_file (only for renamed; unchanged keep same file)
    old_id_to_new_file = {r['old_id']: r['new_file'] for r in rename['renamed']}
    for u in rename['unchanged']:
        old_id_to_new_file[u['old_id']] = u['file']

    lines = []
    def log(s=''):
        lines.append(s)

    log(f'OLD unit_count: {old["unit_count"]}, NEW unit_count: {new["unit_count"]}')

    old_units = {u['unit']: u for u in old['units']}
    new_units = {u['unit']: u for u in new['units']}

    missing_in_new = set(old_units) - set(new_units)
    added_in_new = set(new_units) - set(old_units)
    log(f'units missing in NEW: {sorted(missing_in_new)}')
    log(f'units added in NEW: {sorted(added_in_new)}')

    identical = 0
    text_diff = 0
    range_diff = 0
    headings_diff = 0
    credits_diff = 0
    assets_diff = 0

    for unit_no in sorted(set(old_units) & set(new_units)):
        ou, nu = old_units[unit_no], new_units[unit_no]
        changes = []

        if ou['docx_paragraph_range'] != nu['docx_paragraph_range']:
            range_diff += 1
            changes.append(f'range: {ou["docx_paragraph_range"]} -> {nu["docx_paragraph_range"]}')

        old_words = ou['text_verbatim'].split()
        new_words = nu['text_verbatim'].split()
        if old_words != new_words:
            text_diff += 1
            changes.append(f'text differs (old {len(old_words)} words, new {len(new_words)} words)')

        if ou['headings'] != nu['headings']:
            headings_diff += 1
            changes.append(f'headings: {ou["headings"]} -> {nu["headings"]}')

        old_credits = [(c['song_title'], c['band'], c['album'], c['year']) for c in ou['song_credits']]
        new_credits = [(c['song_title'], c['band'], c['album'], c['year']) for c in nu['song_credits']]
        if old_credits != new_credits:
            credits_diff += 1
            changes.append(f'song_credits: {old_credits} -> {new_credits}')

        # asset identity comparison: map old asset_ids to their expected new
        # filename, compare against actual new asset filenames on this unit
        old_asset_expected_files = sorted(
            old_id_to_new_file.get(a['asset_id'], a['asset_id']) for a in ou['assets']
        )
        new_asset_files = sorted(f"{a['asset_id'].replace('asset-', '')}" for a in nu['assets'])
        # normalize extensions for comparison (asset_id has no extension)
        old_asset_stems = sorted(f.rsplit('.', 1)[0] for f in old_asset_expected_files)
        new_asset_stems = sorted(new_asset_files)
        if old_asset_stems != new_asset_stems:
            assets_diff += 1
            changes.append(f'assets (by identity): {old_asset_stems} -> {new_asset_stems}')

        if changes:
            log(f'\n--- unit {unit_no} CHANGED ---')
            for c in changes:
                log(f'  {c}')
        else:
            identical += 1

    log(f'\n\nSUMMARY:')
    log(f'  identical units: {identical}')
    log(f'  units with paragraph_range diff: {range_diff}')
    log(f'  units with text diff: {text_diff}')
    log(f'  units with headings diff: {headings_diff}')
    log(f'  units with song_credits diff: {credits_diff}')
    log(f'  units with asset-identity diff: {assets_diff}')

    report = '\n'.join(lines)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(report)
    print(report)


if __name__ == '__main__':
    main()
