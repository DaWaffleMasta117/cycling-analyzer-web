import type { StatPillsProps, RideStats } from "../types/powerCurve";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wkg(watts: number, weightKg: number): string {
  if (!weightKg || weightKg <= 0) return "—";
  return (watts / weightKg).toFixed(2);
}

function fmt(value: number): string {
  return value > 0 ? Math.round(value).toString() : "—";
}

// ─── CompareBox ───────────────────────────────────────────────────────────────

interface CompareBoxProps {
  label: string;
  statsA: RideStats | null;
  statsB: RideStats | null;
  getValue: (s: RideStats) => number;
}

function CompareBox({ label, statsA, statsB, getValue }: CompareBoxProps) {
  const wA = statsA ? getValue(statsA) : 0;
  const wB = statsB ? getValue(statsB) : 0;

  const wkgA = statsA ? wkg(wA, statsA.weight_kg) : "—";
  const wkgB = statsB ? wkg(wB, statsB.weight_kg) : "—";

  return (
    <div className="flex flex-col gap-1 py-2.5 px-4 bg-slate-900 border border-slate-800 rounded min-w-[110px]">
      <span className="text-[9px] text-zinc-600 tracking-[0.1em] uppercase font-mono">
        {label}
      </span>

      {/* Range A row */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] text-zinc-600 font-mono w-[14px]">A</span>
        <span className="text-[15px] font-bold leading-none font-mono text-zinc-200">
          {fmt(wA)}
          <span className="text-[9px] text-zinc-600 ml-[2px]">W</span>
        </span>
        <span className="text-[11px] font-mono text-sky-400 leading-none">
          {wkgA}
          <span className="text-[9px] text-zinc-600 ml-[2px]">w/kg</span>
        </span>
      </div>

      {/* Range B row */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] text-emerald-400 font-mono w-[14px]">B</span>
        <span className="text-[15px] font-bold leading-none font-mono text-emerald-400">
          {statsB ? fmt(wB) : "—"}
          {statsB && <span className="text-[9px] text-zinc-600 ml-[2px]">W</span>}
        </span>
        <span className="text-[11px] font-mono text-emerald-300 leading-none">
          {statsB ? wkgB : ""}
          {statsB && <span className="text-[9px] text-zinc-600 ml-[2px]">w/kg</span>}
        </span>
      </div>
    </div>
  );
}

// ─── StatPills ────────────────────────────────────────────────────────────────

/**
 * Four comparison boxes showing peak and average power (Avg W and NP)
 * for Range A vs Range B, with both watts and w/kg per range.
 */
export default function StatPills({ statsA, statsB }: StatPillsProps) {
  return (
    <div className="flex gap-2 flex-wrap" role="list" aria-label="Power comparison metrics">
      <div role="listitem">
        <CompareBox
          label="Peak Avg W"
          statsA={statsA}
          statsB={statsB}
          getValue={s => s.peak_avg_watts}
        />
      </div>
      <div role="listitem">
        <CompareBox
          label="Peak NP"
          statsA={statsA}
          statsB={statsB}
          getValue={s => s.peak_np_watts}
        />
      </div>
      <div role="listitem">
        <CompareBox
          label="Avg W"
          statsA={statsA}
          statsB={statsB}
          getValue={s => s.mean_avg_watts}
        />
      </div>
      <div role="listitem">
        <CompareBox
          label="Avg NP"
          statsA={statsA}
          statsB={statsB}
          getValue={s => s.mean_np_watts}
        />
      </div>
    </div>
  );
}
