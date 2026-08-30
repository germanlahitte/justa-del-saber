"""CRITICAL CHECK: does the EDITORIAL layer's asset_id references still
point to the SAME underlying asset (by content/sha256) after the DOCX
re-save renamed the internal media files?

data/editorial/asset-context.json and song-credits.json reference asset_id
values like "asset-image7", which are derived from the DOCX-internal media
filename at the time each artifact was generated. Word renumbers those
filenames on every re-save (see tools/diff_assets_by_hash.py), so the same
asset_id string can silently point to different bytes across versions if
just re-run blindly.

This script maps each OLD asset_id (as referenced in editorial files) to
its real identity via SHA-256, and checks whether that SAME identity is
still addressable under the SAME asset_id in the regenerated
assets-manifest.json. Read-only; writes no files.
"""
import json

OLD_MANIFEST = r'data\backups\_pre-rebaseline-backup\assets-manifest.json'
NEW_MANIFEST = r'data\assets-manifest.json'
ASSET_CONTEXT = r'data\editorial\asset-context.json'
SONG_CREDITS = r'data\editorial\song-credits.json'


def main():
    old_manifest = json.load(open(OLD_MANIFEST, encoding='utf-8'))
    new_manifest = json.load(open(NEW_MANIFEST, encoding='utf-8'))
    old_by_id = {a['id']: a for a in old_manifest['assets']}
    new_by_id = {a['id']: a for a in new_manifest['assets']}
    new_by_sha = {a['sha256']: a for a in new_manifest['assets']}

    asset_context = json.load(open(ASSET_CONTEXT, encoding='utf-8'))
    song_credits = json.load(open(SONG_CREDITS, encoding='utf-8'))

    print('=== asset-context.json referenced asset_id integrity ===')
    broken = []
    for entry in asset_context['asset_context']:
        if 'asset_sha256' in entry:
            exists = any(a['sha256'] == entry['asset_sha256'] for a in new_manifest['assets'])
            print(f'  {entry["id"]} ({entry.get("decision_id")}): addressed by sha256 '
                  f'{entry["asset_sha256"][:12]}... -> target content still present = {exists}')
            continue
        aid = entry['asset_id']
        old_asset = old_by_id.get(aid)
        if old_asset is None:
            print(f'  {entry["id"]} ({aid}): NOT FOUND IN OLD MANIFEST (unexpected)')
            continue
        old_sha = old_asset['sha256']
        # what does aid now point to?
        new_asset_same_id = new_by_id.get(aid)
        # what SHOULD it point to (same content, wherever it landed)?
        correct_new_asset = new_by_sha.get(old_sha)
        same_content = (new_asset_same_id is not None and
                        new_asset_same_id['sha256'] == old_sha)
        status = 'OK (same id, same content)' if same_content else 'BROKEN'
        if not same_content:
            broken.append({
                'entry_id': entry['id'],
                'decision_id': entry.get('decision_id'),
                'referenced_asset_id': aid,
                'old_content_now_lives_at': correct_new_asset['id'] if correct_new_asset else 'UNRESOLVED',
                'asset_id_now_points_to_different_content':
                    new_asset_same_id['id'] if new_asset_same_id else 'NOTHING (id no longer exists)',
            })
        print(f'  {entry["id"]} ({aid}): {status}')

    print(f'\n=== song-credits.json: no asset_id references (uses book_unit_id) ===')

    print(f'\n\nBROKEN REFERENCES: {len(broken)}')
    for b in broken:
        print(f'  {b}')

    with open(r'data\backups\_pre-rebaseline-v2-backup\editorial-impact-report.json', 'w', encoding='utf-8') as f:
        json.dump({'broken_count': len(broken), 'broken': broken}, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
