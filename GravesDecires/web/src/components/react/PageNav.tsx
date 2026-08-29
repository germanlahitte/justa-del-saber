import { useEffect, useRef, useState } from 'react';

// Continuous reading navigation for MODO LEER — corrected model (v0.2):
// the reading unit is the PHYSICAL PAGE, not the BookUnit. This island
// only handles navigation chrome (prev/next, keyboard arrows, swipe) — it
// never fetches or renders page content itself; Astro already rendered
// the current page's content server-side.
//
// A5 SHELL (v0.4): this island decides spread vs single by the REAL width
// of the reader SHELL CONTAINER (not the viewport, not the device). The
// threshold is read from the SAME CSS custom property the @container query
// in src/pages/libro/p/[n].astro uses (--reader-spread-min), so the JS and
// CSS can never drift. A ResizeObserver re-measures the container live if
// it resizes. At/above the threshold navigation moves a whole spread;
// below it, one page at a time. The route passes spreadLeft/spreadRight
// (L/R) and the spread pairings are unchanged.
interface Props {
  page: number;
  total: number;
  /** First physical page of the requested spread (L). Portada alone → 1. */
  spreadLeft: number;
  /** Second physical page of the requested spread (R = L+1). Portada → 1. */
  spreadRight: number;
}

/** Stable selector for the reader shell container (the element that owns
 * the container query and exposes --reader-spread-min). */
const SHELL_SELECTOR = '[data-reader-shell]';

/** Fallback ONLY if the CSS custom property cannot be read. Must match
 * --reader-spread-min in src/pages/libro/p/[n].astro (and PageShell/docs).
 * Kept here as a loud-canary backstop; the CSS-var path is preferred. */
const FALLBACK_SPREAD_MIN = 688;

function readSpreadMin(shell: Element): number {
  const raw = window.getComputedStyle(shell).getPropertyValue('--reader-spread-min').trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : FALLBACK_SPREAD_MIN;
}

function isPortada(l: number, r: number): boolean {
  return l === 1 && r === 1;
}

export default function PageNav({ page, total, spreadLeft, spreadRight }: Props) {
  const [isSpread, setIsSpread] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const shell = document.querySelector(SHELL_SELECTOR);
    if (!shell) return;

    const update = () => {
      const wide = shell.clientWidth >= readSpreadMin(shell);
      setIsSpread((prev) => (prev === wide ? prev : wide));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const portada = isPortada(spreadLeft, spreadRight);

  const { prevHref, nextHref } = (() => {
    if (isSpread) {
      if (portada) {
        // Portada is shown alone: the next spread is [2|3] (L+2=3).
        return {
          prevHref: null as string | null,
          nextHref: spreadLeft + 2 <= total ? `/libro/p/${spreadLeft + 2}` : null,
        };
      }
      // Spread moves a full spread: from [L|R] the previous spread is
      // [L-2|L-1] (falling back to [1] right before [2|3]) and the next
      // one is [L+2|L+3].
      const prevHref =
        spreadLeft === 2 ? '/libro/p/1' : spreadLeft > 2 ? `/libro/p/${spreadLeft - 2}` : null;
      const nextHref = spreadLeft + 2 <= total ? `/libro/p/${spreadLeft + 2}` : null;
      return { prevHref, nextHref };
    }
    // Single mode moves one physical page.
    return {
      prevHref: page > 1 ? `/libro/p/${page - 1}` : null,
      nextHref: page < total ? `/libro/p/${page + 1}` : null,
    };
  })();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && nextHref) window.location.href = nextHref;
      if (e.key === 'ArrowLeft' && prevHref) window.location.href = prevHref;
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prevHref, nextHref]);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0]?.clientX ?? null;
    }
    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null) return;
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
      const SWIPE_THRESHOLD = 60;
      if (dx < -SWIPE_THRESHOLD && nextHref) window.location.href = nextHref;
      if (dx > SWIPE_THRESHOLD && prevHref) window.location.href = prevHref;
      touchStartX.current = null;
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [prevHref, nextHref]);

  const indicator = isSpread
    ? portada
      ? `${spreadLeft} / ${total}`
      : `${spreadLeft}–${spreadRight} / ${total}`
    : `${page} / ${total}`;

  return (
    <nav
      className="sticky bottom-0 z-30 flex items-center justify-between gap-4 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm sm:px-6"
      aria-label="Navegación de páginas del libro"
    >
      {prevHref ? (
        <a
          href={prevHref}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
        >
          ← Página anterior
        </a>
      ) : (
        <span className="font-mono text-xs uppercase tracking-wide text-ink-faint opacity-40">← Página anterior</span>
      )}

      <span className="font-mono text-xs text-ink-faint">{indicator}</span>

      {nextHref ? (
        <a
          href={nextHref}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-accent"
        >
          Página siguiente →
        </a>
      ) : (
        <span className="font-mono text-xs uppercase tracking-wide text-ink-faint opacity-40">Página siguiente →</span>
      )}
    </nav>
  );
}
