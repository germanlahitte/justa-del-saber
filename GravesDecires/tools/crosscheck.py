"""Cross-check: songs vs QR coverage. Read-only report. SOURCE: BOOK/ASSET."""
import json

m = json.load(open(r'data\assets-manifest.json', encoding='utf-8'))
qr_songs = set()
for a in m['assets']:
    if a['type'] == 'qr' and a['accompanies'] != 'NEEDS-REVIEW':
        qr_songs.add(a['accompanies'])

bm = json.load(open(r'data\book-model.json', encoding='utf-8'))
all_songs = set()
for u in bm['units']:
    for c in u['song_credits']:
        all_songs.add(f"{c['song_title']} ({c['band']})")

print('songs with QR:', len(qr_songs))
print('songs total:', len(all_songs))
print('songs WITHOUT associated QR:')
for s in sorted(all_songs - qr_songs):
    print('  ', s)
print('QR-associated names not matching a credit:')
for s in sorted(qr_songs - all_songs):
    print('  ', s)
