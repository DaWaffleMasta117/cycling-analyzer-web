import type { StatPillsProps } from "../types/powerCurve";

// ─── StatPill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: number | string;
  unit: string;
  highlight?: boolean;
}

function StatPill({ label, value, unit, highlight = false }: StatPillProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 py-2.5 px-4 bg-slate-900 border rounded min-w-[90px] ${
        highlight ? "border-emerald-400" : "border-slate-800"
      }`}
    >
      <span className="text-[9px] text-zinc-600 tracking-[0.1em] uppercase font-mono">
        {label}
      </span>
      <span
        className={`text-[18px] font-bold leading-[1.1] font-mono ${
          highlight ? "text-emerald-400" : "text-zinc-200"
        }`}
      >
        {value}
        <span className="text-[10px] text-zinc-700 ml-[3px]">{unit}</span>
      </span>
    </div>
  );
}

// ─── StatPills ────────────────────────────────────────────────────────────────

/**
 * The four key-metric pills shown in the top-right of the header:
 * FTP estimate, W/kg FTP, 5-minute peak, and 3-second sprint.
 */
export default function StatPills({ ftp, wkgFtp, map5m, sprint }: StatPillsProps) {
  return (
    <div className="flex gap-2 flex-wrap" role="list" aria-label="Key power metrics">
      <div role="listitem">
        <StatPill label="FTP est." value={ftp} unit="W" />
      </div>
      <div role="listitem">
        <StatPill label="W/kg FTP" value={wkgFtp} unit="" />
      </div>
      <div role="listitem">
        <StatPill label="5m Peak" value={map5m} unit="W" highlight />
      </div>
      <div role="listitem">
        <StatPill label="Sprint" value={sprint} unit="W" />
      </div>
    </div>
  );
}
