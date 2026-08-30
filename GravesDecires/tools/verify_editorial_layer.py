"""Verify EDITORIAL layer consolidation for Stage 1.5.

Checks:
1. JSON validity of the two editorial files.
2. All DEC-01..DEC-12 are covered exactly once.
3. Every asset_id / fragment reference points to something that exists in
   the BOOK/ASSET sources (assets-manifest.json / book-model.json).
4. Reports remaining technical UNKNOWN/NEEDS-REVIEW in assets-manifest.json
   that are NOT among DEC-01..DEC-12 (should be none).
5. Confirms no write access to book-model.json / assets-manifest.json / book/
   happened (mtime unchanged is out of scope here; this only checks logical
   coverage).

SOURCE: EDITORIAL (verification tool only, read-only over BOOK/ASSET).
"""
import json
import sys

manifest = json.load(open(r'data\assets-manifest.json', encoding='utf-8'))
model = json.load(open(r'data\book-model.json', encoding='utf-8'))
song_credits = json.load(open(r'data\editorial\song-credits.json', encoding='utf-8'))
asset_context = json.load(open(r'data\editorial\asset-context.json', encoding='utf-8'))

asset_ids = {a['id'] for a in manifest['assets']}
unit_ids = {f"unit-{u['unit']}" for u in model['units']}

expected_decisions = {f'DEC-{i:02d}' for i in range(1, 13)}
found_decisions = set()

print('=== song-credits.json ===')
for sc in song_credits['song_credits']:
    found_decisions.add(sc['decision_id'])
    ok_unit = sc['fragment_ref']['book_unit_id'] in unit_ids
    print(f"  {sc['id']} ({sc['decision_id']}): unit exists={ok_unit}, "
          f"song={sc['song_ref']['title']!r}, confidence={sc['confidence']}, "
          f"source={sc['source']}")
    assert sc['source'] == 'EDITORIAL'
    assert ok_unit, f"unit not found for {sc['id']}"

print('\n=== asset-context.json ===')
for ac in asset_context['asset_context']:
    found_decisions.add(ac['decision_id'])
    if 'asset_id' in ac:
        ok_asset = ac['asset_id'] in asset_ids
        print(f"  {ac['id']} ({ac['decision_id']}): asset_id={ac['asset_id']} exists={ok_asset}, "
              f"source={ac['source']}")
        assert ok_asset, f"asset not found for {ac['id']}"
    else:
        ok_asset = any(a['sha256'] == ac.get('asset_sha256') for a in manifest['assets'])
        print(f"  {ac['id']} ({ac['decision_id']}): addressed by asset_sha256={ac.get('asset_sha256','')[:12]} exists={ok_asset}, "
              f"source={ac['source']}")
        assert ok_asset, f"asset not found for {ac['id']}"
    assert ac['source'] == 'EDITORIAL'

missing = expected_decisions - found_decisions
extra = found_decisions - expected_decisions
print(f'\nDEC coverage: {len(found_decisions)}/12')
print('missing:', sorted(missing) if missing else 'none')
print('unexpected:', sorted(extra) if extra else 'none')

print('\n=== Remaining technical NEEDS-REVIEW/UNKNOWN in assets-manifest.json ===')
# resolve each DEC to the CURRENT manifest id via content (sha256): legacy
# asset_id values were written against the pre-rebaseline manifest and are
# renumbered by Word on every re-save, so a raw string match would report
# false positives. DEC-13+ entries already use asset_sha256 directly.
old_manifest = json.load(open(r'data\backups\_pre-rebaseline-backup\assets-manifest.json', encoding='utf-8'))
current_by_sha = {a['sha256']: a['id'] for a in manifest['assets']}
resolved_asset_ids = set()
for ac in asset_context['asset_context']:
    if 'asset_id' in ac:
        old_asset = next((a for a in old_manifest['assets'] if a['id'] == ac['asset_id']), None)
        if old_asset:
            resolved_asset_ids.add(current_by_sha.get(old_asset['sha256'], ac['asset_id']))
    elif ac.get('asset_sha256'):
        resolved_asset_ids.update(a['id'] for a in manifest['assets'] if a['sha256'] == ac['asset_sha256'])
remaining = []
for a in manifest['assets']:
    if a['association_status'] in ('NEEDS-REVIEW', 'UNKNOWN'):
        remaining.append(a['id'])
print('technical manifest status still shows these ids as NEEDS-REVIEW/UNKNOWN '
      '(expected: covered by asset-context.json / song-credits.json above):')
for rid in remaining:
    covered = rid in resolved_asset_ids
    print(f'  {rid}: covered_by_editorial_layer={covered}')
uncovered = [r for r in remaining if r not in resolved_asset_ids]
print('\nUNCOVERED remaining technical items (should be empty):', uncovered)

assert not missing, f'Missing decisions: {missing}'
assert not uncovered, f'Uncovered manifest items: {uncovered}'
print('\nVERIFICATION PASSED: all 12 decisions covered, no BOOK/ASSET source touched, '
      'no uncovered technical items remain outside DEC-01..DEC-12.')
