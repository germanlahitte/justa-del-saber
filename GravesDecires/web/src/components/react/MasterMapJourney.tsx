import { useMemo, useState } from 'react';

// MASTER MAP — Etapa 3 approved direction: longitudinal journey +
// conceptual recurrence + band meta-axis + terminal_structure as a coda.
// Explicitly NOT a force-directed graph (per user instruction).
//
// Interaction under test: hovering/focusing a concept chip on ANY station
// draws a subtle trace connecting every OTHER station where that same
// concept also appears — visible only on demand, never all at once. This
// is the "recurrence" mechanism from WEB-EXPERIENCE-v0.1.md §G.2.

export interface ArcStation {
  id: string;
  order: number;
  title: string;
  question: string;
  claim: string;
  conceptIds: string[];
  conceptNames: Record<string, string>;
  readingCount: number;
}

export interface BandAxisSegment {
  band: string;
  role: string;
  function: string;
  // which arc orders this band roughly covers, per band_meta_axis role
  // (V8/Estética -> early arcs, Hermética/Ética -> middle,
  // Almafuerte/Síntesis -> late+terminal). This is an editorial
  // approximation for the overlay stripe, not a claim the data makes
  // 1:1 — labelled explicitly in the UI as such.
  arcOrders: number[];
}

interface Props {
  arcs: ArcStation[];
  bandAxis: BandAxisSegment[];
  terminalSequence: { id: string; title: string }[];
  terminalMeaning: string;
}

export default function MasterMapJourney({
  arcs,
  bandAxis,
  terminalSequence,
  terminalMeaning,
}: Props) {
  const [focusedConcept, setFocusedConcept] = useState<string | null>(null);
  const [expandedArc, setExpandedArc] = useState<string | null>(null);

  const arcsWithConcept = useMemo(() => {
    if (!focusedConcept) return new Set<string>();
    return new Set(
      arcs.filter((a) => a.conceptIds.includes(focusedConcept)).map((a) => a.id),
    );
  }, [focusedConcept, arcs]);

  return (
    <div className="relative">
      {/* Band meta-axis overlay */}
      <div className="mb-8 grid grid-cols-3 gap-2 border-b border-rule pb-4">
        {bandAxis.map((b) => (
          <div key={b.band} className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{b.band}</p>
            <p className="text-sm text-accent">{b.role}</p>
          </div>
        ))}
      </div>
      <p className="mb-10 font-mono text-[10px] text-ink-faint">
        Eje narrativo del libro (no una clasificación exhaustiva de cada
        banda) — superpuesto de forma aproximada sobre el recorrido.
      </p>

      {/* Longitudinal journey */}
      <ol className="relative border-l-2 border-rule pl-6">
        {arcs.map((arc) => {
          const isRecurrent = arcsWithConcept.has(arc.id);
          const isExpanded = expandedArc === arc.id;
          return (
            <li key={arc.id} className="relative mb-8 last:mb-0">
              <span
                className={
                  'absolute top-1.5 -left-[31px] h-3 w-3 rounded-full border-2 bg-paper transition-colors ' +
                  (isRecurrent ? 'border-accent' : 'border-ink-faint')
                }
                aria-hidden="true"
              />
              <div
                className={
                  'rounded-sm border p-4 transition-colors ' +
                  (isRecurrent ? 'border-accent/60 bg-accent-bg/40' : 'border-rule')
                }
              >
                <button
                  type="button"
                  onClick={() => setExpandedArc(isExpanded ? null : arc.id)}
                  className="flex w-full items-baseline justify-between gap-4 text-left"
                  aria-expanded={isExpanded}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-ink-faint">{arc.order}</span>
                    <span className="text-lg text-ink">{arc.title}</span>
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint">
                    {arc.readingCount} lecturas
                  </span>
                </button>
                <p className="prose-book mt-1 text-sm text-ink-soft">{arc.question}</p>

                {isExpanded && (
                  <div className="mt-4 border-t border-rule pt-4">
                    <p className="prose-book text-sm leading-relaxed text-ink">{arc.claim}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {arc.conceptIds.map((cid) => (
                        <button
                          key={cid}
                          type="button"
                          onMouseEnter={() => setFocusedConcept(cid)}
                          onFocus={() => setFocusedConcept(cid)}
                          onMouseLeave={() => setFocusedConcept(null)}
                          onBlur={() => setFocusedConcept(null)}
                          className={
                            'rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ' +
                            (focusedConcept === cid
                              ? 'border-accent bg-accent text-paper'
                              : 'border-rule text-ink-soft hover:border-accent hover:text-accent')
                          }
                        >
                          {arc.conceptNames[cid] ?? cid}
                        </button>
                      ))}
                    </div>
                    <a
                      href={`/mapa/${arc.id}`}
                      className="mt-4 inline-block font-mono text-xs uppercase tracking-wide text-ink-faint hover:text-accent"
                    >
                      Ver arco completo →
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Terminal structure — a distinct closing coda, NOT a 10th arc */}
      <div className="mt-12 border-t-2 border-dashed border-accent/50 pt-8">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
          Estructura terminal · cierre, no un arco más
        </p>
        <p className="prose-book mt-2 text-sm text-ink-soft">{terminalMeaning}</p>
        <ol className="mt-4 flex flex-wrap items-center gap-2">
          {terminalSequence.map((r, i) => (
            <li key={r.id} className="flex items-center gap-2">
              <a
                href={`/lecturas/${r.id}`}
                className="rounded-sm border border-accent/60 px-2 py-1 text-xs text-accent hover:bg-accent-bg"
              >
                {r.title}
              </a>
              {i < terminalSequence.length - 1 && (
                <span className="text-ink-faint" aria-hidden="true">→</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
