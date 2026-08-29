import { useEffect, useId, useRef, useState } from 'react';

// ORIGINAL ↔ LECTURA — Etapa 3 approved pattern:
//   desktop  -> contextual side drawer
//   mobile   -> bottom-sheet
//   optional -> expand to the full Reading page
//
// This is the ONE interactive island this prototype needs for the core
// interaction under test. It never fetches Reading content eagerly: all
// data is passed in as props already resolved at build time by the Astro
// page (see BookUnitView usage), and the drawer only controls
// open/closed local UI state — no data fetching happens on open.
//
// The trigger button is the "book knows an interpretation exists" signal
// from WEB-EXPERIENCE-v0.1.md §B.4 (revised): BOOK may know
// book_unit -> reading_ids[] to decide whether to render the trigger, but
// must not render Reading content until the reader asks for it. This
// component receives the resolved readings array as a prop (already
// computed at build time) but does not RENDER any of it until `open`
// becomes true.

export interface ConceptChipData {
  id: string;
  name: string;
}

export interface ReadingSummary {
  id: string;
  title: string;
  section: string;
  kind: string;
  thesis: string;
  concepts: ConceptChipData[];
  connections: { id: string; title: string }[];
  /** Each BookUnit this Reading references, already resolved to its first
   * real physical page (see src/lib/bookUnitPage.ts) — this component has
   * no access to Content Collections, so the page number must arrive
   * pre-resolved from the Astro page that builds this prop. */
  bookUnits: { unit: number; page: number }[];
  fullHref: string;
}

interface Props {
  readings: ReadingSummary[];
  /** The BookUnit whose fragment triggered this drawer on the current
   * page — used only to exclude it from the "this reading also crosses"
   * list, never to fetch or gate content. */
  currentUnit: number;
}

export default function ReadingDrawer({ readings, currentUnit }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(readings[0]?.id ?? null);
  const dialogId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (readings.length === 0) return null;

  const active = readings.find((r) => r.id === activeId) ?? readings[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className="group inline-flex items-center gap-2 rounded-sm border border-accent/60 bg-accent-bg px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-accent transition-colors hover:border-accent"
      >
        <span aria-hidden="true" className="text-accent">●</span>
        Hay {readings.length === 1 ? 'una lectura' : `${readings.length} lecturas`} sobre esto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end sm:items-stretch">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar lectura"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
          />

          {/* Panel: bottom-sheet on mobile, side drawer on sm+ */}
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label={`Lectura: ${active.title}`}
            className="relative flex max-h-[85vh] w-full flex-col overflow-y-auto border-t border-rule bg-paper p-6 shadow-2xl sm:max-h-none sm:w-[420px] sm:border-t-0 sm:border-l"
            style={{ marginTop: 'auto' }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  Lectura · capa interpretativa
                </p>
                <p className="mt-1 font-mono text-[10px] text-ink-faint">{active.section}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-rule px-2 py-1 font-mono text-xs text-ink-faint hover:text-ink"
              >
                Cerrar
              </button>
            </div>

            {readings.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {readings.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={
                      'rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ' +
                      (r.id === active.id
                        ? 'border-accent text-accent'
                        : 'border-rule text-ink-faint hover:text-ink')
                    }
                  >
                    {r.title.length > 28 ? r.title.slice(0, 28) + '…' : r.title}
                  </button>
                ))}
              </div>
            )}

            <h3 className="text-xl leading-snug font-normal text-ink">{active.title}</h3>
            <p className="prose-book mt-3 text-sm leading-relaxed text-ink-soft">{active.thesis}</p>

            {active.concepts.length > 0 && (
              <div className="mt-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Conceptos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {active.concepts.map((c) => (
                    <a
                      key={c.id}
                      href={`/conceptos/${c.id}`}
                      className="rounded-sm border border-rule px-2 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent"
                    >
                      {c.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {active.bookUnits.length > 1 && (
              <div className="mt-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  Esta lectura también cruza
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {active.bookUnits
                    .filter((u) => u.unit !== currentUnit)
                    .map((u) => (
                      <a
                        key={u.unit}
                        href={`/libro/p/${u.page}`}
                        className="rounded-sm border border-rule px-2 py-1 font-mono text-xs text-ink-soft hover:border-accent hover:text-accent"
                      >
                        p. {u.page} →
                      </a>
                    ))}
                </div>
              </div>
            )}

            {active.connections.length > 0 && (
              <div className="mt-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  Lecturas relacionadas
                </p>
                <ul className="mt-2 space-y-1">
                  {active.connections.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(c.id)}
                        className="text-left text-xs text-ink-soft underline decoration-dotted underline-offset-2 hover:text-accent"
                        disabled={!readings.some((r) => r.id === c.id)}
                      >
                        {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={active.fullHref}
              className="mt-6 inline-flex w-fit items-center gap-2 border-t border-rule pt-4 font-mono text-xs uppercase tracking-wide text-ink-faint hover:text-accent"
            >
              Ver lectura completa →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
