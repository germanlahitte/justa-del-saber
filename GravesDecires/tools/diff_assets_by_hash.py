"""Compare OLD vs NEW extracted assets by SHA-256, not by filename.

Word renumbers embedded media (image1.png, image2.png, ...) whenever a DOCX
is re-saved after edits — the filename is NOT a stable identity across
versions. This script identifies:
  - UNCHANGED: same bytes exist in both old and new sets (possibly under a
    different filename).
  - RENAMED: an old asset's bytes exist in the new set under a different
    filename.
  - REMOVED: an old asset's bytes do not exist anywhere in the new set.
  - ADDED: a new asset's bytes do not exist anywhere in the old set.

Read-only. Writes a JSON diff report, does not touch any canonical file.
"""
import hashlib
import json
import os

OLD_LOG = r'data\_pre-rebaseline-v2-backup\extraction-log-OLD.json'
NEW_MEDIA_DIR = r'assets\docx-media'
OUT = r'data\_pre-rebaseline-v2-backup\asset-hash-diff.json'


def main():
    # The "OLD" extraction-log.json backup got overwritten before I could
    # copy it (see session note); recompute old hashes from the OLD
    # assets-manifest.json backup instead, which still has each asset's
    # original sha256 recorded independently of the extraction-log file.
    old_manifest = json.load(open(r'data\_pre-rebaseline-v2-backup\assets-manifest.json', encoding='utf-8'))
    old_by_hash = {a['sha256']: a for a in old_manifest['assets']}

    new_by_hash = {}
    for name in sorted(os.listdir(NEW_MEDIA_DIR)):
        path = os.path.join(NEW_MEDIA_DIR, name)
        with open(path, 'rb') as f:
            sha = hashlib.sha256(f.read()).hexdigest()
        new_by_hash[sha] = name

    unchanged = []
    renamed = []
    removed = []
    for sha, old_asset in old_by_hash.items():
        old_name = old_asset['extracted_file'].split('/')[-1]
        if sha in new_by_hash:
            new_name = new_by_hash[sha]
            if new_name == old_name:
                unchanged.append({'old_id': old_asset['id'], 'file': old_name})
            else:
                renamed.append({'old_id': old_asset['id'], 'old_file': old_name, 'new_file': new_name})
        else:
            removed.append({'old_id': old_asset['id'], 'old_file': old_name, 'sha256': sha})

    old_hashes = set(old_by_hash.keys())
    added = [{'new_file': name, 'sha256': sha} for sha, name in new_by_hash.items() if sha not in old_hashes]

    result = {
        'unchanged_count': len(unchanged),
        'renamed_count': len(renamed),
        'removed_count': len(removed),
        'added_count': len(added),
        'unchanged': unchanged,
        'renamed': renamed,
        'removed': removed,
        'added': added,
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f'unchanged (same bytes, same filename): {len(unchanged)}')
    print(f'renamed (same bytes, different filename): {len(renamed)}')
    print(f'removed (old bytes not found in new set): {len(removed)}')
    print(f'added (new bytes not found in old set): {len(added)}')
    if renamed:
        print('\nRENAMED:')
        for r in renamed:
            print(f"  {r['old_id']}: {r['old_file']} -> {r['new_file']}")
    if removed:
        print('\nREMOVED:')
        for r in removed:
            print(f"  {r['old_id']}: {r['old_file']} (sha256={r['sha256'][:12]}...)")
    if added:
        print('\nADDED:')
        for a in added:
            print(f"  {a['new_file']} (sha256={a['sha256'][:12]}...)")


if __name__ == '__main__':
    main()
