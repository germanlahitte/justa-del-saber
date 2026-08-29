"""After re-baseline: verify which of the 12 original editorial decisions
(DEC-01..DEC-12) still correspond to a real pending item in the
regenerated technical manifest, and which are now resolved automatically
by the corrected DOCX (so the editorial override becomes redundant, not
wrong)."""
import json

m = json.load(open(r'data\assets-manifest.json', encoding='utf-8'))
diff = json.load(open(r'data\_pre-rebaseline-v2-backup\asset-hash-diff.json', encoding='utf-8'))
remap = {r['old_id']: r['new_file'].rsplit('.', 1)[0].replace('image', 'asset-image')
         for r in diff['renamed']}
for u in diff['unchanged']:
    remap[u['old_id']] = u['file'].rsplit('.', 1)[0].replace('image', 'asset-image')

decisions = {
    'DEC-01': 'asset-image7', 'DEC-02': 'asset-image17', 'DEC-03': 'asset-image29',
    'DEC-04': 'asset-image13', 'DEC-05': 'asset-image6', 'DEC-06': 'asset-image39',
    'DEC-07': 'asset-image32', 'DEC-08': 'asset-image16', 'DEC-09': 'asset-image52',
    'DEC-10': 'asset-image25', 'DEC-11': 'asset-image28',
}

by_id = {a['id']: a for a in m['assets']}
for dec, old_id in decisions.items():
    new_id = remap.get(old_id, old_id)
    asset = by_id.get(new_id)
    status = asset['association_status'] if asset else 'ASSET NOT FOUND'
    still_needed = status in ('NEEDS-REVIEW', 'UNKNOWN')
    print(f'{dec}: {old_id} -> {new_id} | technical status now: {status} | '
          f'editorial override still needed: {still_needed}')
