"""Permanent rebaseline regression gate for Rebaseline V3 assets.

Guards against Silent Rebaseline Drift in `book/Graves decires de aguda
intuición.{docx,pdf}` (the source-of-truth being regressed by re-baselines).
This is the regression test added by REBASELINE-V3-ASSET-REPAIR-v0.1.md: any
future Word re-save that renumbers embedded media (image1.png -> image48.png)
or swaps extensions must NOT silently corrupt asset identity / placement.

It is deliberately SHA-first: identity and placement are resolved through the
asset's SHA-256 content, never through its DOCX-internal filename. The whole
point is that Word MAY renumber/rename every file on a re-baseline *supported*
case, and this gate must still pass. It fails loudly (exit != 0) if any
canonical invariant drifts.

Gates:
  G1  IDENTITY   55 assets, 55 unique SHA-256; every asset's extracted_file
                  physical bytes hash to its manifest sha256; QR assets carry
                  a decoded qr_value. Fails on missing/duplicate/mismatched
                  identity. Permanent, no baseline required.
  G2  PLACEMENT  manifest pdf_page must agree with the perceptual page match
                  resolved VIA sha (data/image-match.json + extraction-log).
                  Fails if an asset lands on a different physical page than
                  its perceptual match. Permanent, no baseline required.
  G3  CONTENT    source-references must be content-identical to the approved
                  editorial baseline (data/baselines/source-references-approved-v1.json),
                  keyed by qr_asset_id. Best-effort: if the baseline is missing
                  it is reported, not failed.
                   NOTE: G3 was re-baselined from the historical
                   data/backups/_pre-rebaseline-v3-backup snapshot to source-references-approved-v1
                  after two INTENTIONAL editorial edits per decisions 6 & 16
                  (asset-image34 'Si me ves volver' on p79, asset-image35
                  'Conferencia de Prensa' on p7). Those were deliberate content
                  changes, NOT data regression, so G3 now compares against the
                  editorially-validated approved state. The historical backup is
                  preserved untouched as traceability.

Usage:
  python tools/verify_rebaseline_assets.py
"""
import hashlib
import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'data', 'assets-manifest.json')
MEDIA_DIR = os.path.join(ROOT, 'assets', 'docx-media')
IMAGE_MATCH = os.path.join(ROOT, 'data', 'image-match.json')
EXTRACTION = os.path.join(ROOT, 'data', 'extraction-log.json')
SOURCE_REFS = os.path.join(ROOT, 'data', 'source-references.json')
# Approved editorial baseline for G3 CONTENT. Re-baselined from the historical
# data/backups/_pre-rebaseline-v3-backup snapshot after two INTENTIONAL editorial edits
# (decisions 6 & 16: asset-image34 'Si me ves volver' on p79, asset-image35
# 'Conferencia de Prensa' on p7). The historical backup remains untouched as
# traceability; this snapshot records the currently approved editorial state.
VALIDATED_BASELINE = os.path.join(
    ROOT, 'data', 'baselines', 'source-references-approved-v1.json')

FAILURES = []


def fail(msg):
    FAILURES.append(msg)
    print('  FAIL:', msg)


# --------------------------------------------------------------------------
# G1 IDENTITY
# --------------------------------------------------------------------------
def gate_identity():
    print('G1 IDENTITY')
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    assets = manifest['assets']
    if len(assets) != 55:
        fail(f'expect 55 assets, got {len(assets)}')
    id_shas = [a['sha256'] for a in assets]
    dup = [k for k, v in Counter(id_shas).items() if v > 1]
    if dup:
        fail(f'duplicate asset sha256: {dup}')
    if len(set(id_shas)) != len(assets):
        fail(f'unique shas != asset count ({len(set(id_shas))} != {len(assets)})')
    counts = Counter(a['type'] for a in assets)
    if counts.get('qr') != 43 or counts.get('imagen-editorial') != 12:
        fail(f'type counts wrong: {dict(counts)} (expect 43 qr, 12 imagen-editorial)')
    for a in assets:
        base = a.get('extracted_file', '').rsplit('/', 1)[-1]
        path = os.path.join(MEDIA_DIR, base)
        if not os.path.exists(path):
            fail(f'{a["id"]}: extracted_file missing {path}')
            continue
        h = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        if h != a['sha256']:
            fail(f'{a["id"]}: extracted_file {base} sha mismatch '
                 f'({h[:12]} != {a["sha256"][:12]})')
        if a['type'] == 'qr' and not a.get('qr_value'):
            fail(f'{a["id"]}: qr asset missing qr_value')
    print(f'  -> {len(assets)} assets, unique-sha {len(set(id_shas))}, 0 absent')


# --------------------------------------------------------------------------
# G2 PLACEMENT (via sha, no baseline)
# --------------------------------------------------------------------------
def gate_placement():
    print('G2 PLACEMENT')
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    match = json.load(open(IMAGE_MATCH, encoding='utf-8'))
    extraction = json.load(open(EXTRACTION, encoding='utf-8'))
    sha_by_file = {
        f['extracted_file'].split('/')[-1]: f['sha256'] for f in extraction['files']
    }
    page_by_sha = {
        sha_by_file[m['docx_media']]: m.get('pdf_page')
        for m in match['matches']
        if m.get('pdf_page') is not None and m['docx_media'] in sha_by_file
    }
    bad = 0
    for a in manifest['assets']:
        mp = a.get('pdf_page')
        expect = page_by_sha.get(a['sha256'])
        if expect is None:
            fail(f'{a["id"]}: no perceptual page for sha {a["sha256"][:12]}')
            bad += 1
        elif mp != expect:
            fail(f'{a["id"]}: manifest pdf_page {mp} != perceptual {expect}')
            bad += 1
    print(f'  -> {len(manifest["assets"])} assets, {bad} placement drift')


# --------------------------------------------------------------------------
# G3 CONTENT (vs validated baseline, best-effort)
# --------------------------------------------------------------------------
def gate_content():
    print('G3 CONTENT')
    if not os.path.exists(VALIDATED_BASELINE):
        print('  (validated baseline missing; content gate skipped)')
        return
    cur = json.load(open(SOURCE_REFS, encoding='utf-8'))['references']
    prev = json.load(open(VALIDATED_BASELINE, encoding='utf-8'))['references']
    cur_by_id = {r['qr_asset_id']: r for r in cur}
    prev_by_id = {r['qr_asset_id']: r for r in prev}

    def label(r):
        if r is None or r['source_ref'] is None:
            return '(unresolved)'
        sr = r['source_ref']
        if sr['type'] == 'song':
            return (sr['title'], sr['band'])
        return (sr.get('description') or sr['type'])

    diff = 0
    for aid in sorted(set(cur_by_id) | set(prev_by_id)):
        c = cur_by_id.get(aid)
        p = prev_by_id.get(aid)
        if c is None or p is None:
            fail(f'{aid}: present in only one side')
            diff += 1
            continue
        if label(c) != label(p):
            fail(f'{aid}: content changed {label(p)!r} -> {label(c)!r}')
            diff += 1
    print(f'  -> {len(cur)} current refs, {diff} content drift vs baseline')


def main():
    print('REBASELINE ASSET REGRESSION GATE')
    print('=' * 40)
    gate_identity()
    gate_placement()
    gate_content()
    print('=' * 40)
    if FAILURES:
        print(f'GATE FAILED: {len(FAILURES)} invariant(s) drifted.')
        for f in FAILURES:
            print('  -', f)
        return 1
    print('ALL GATES PASS (identity, placement, content stable).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
