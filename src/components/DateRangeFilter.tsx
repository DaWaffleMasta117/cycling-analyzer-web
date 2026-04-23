import { useState, useEffect, useRef } from "react";
import type { DateRangeFilterProps } from "../types/powerCurve";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
const CURRENT_YEAR = new Date().getFullYear();

type PickerMode = "year" | "month" | "day";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Returns the number of days in month `m` (1-indexed) of year `y`. */
function lastDay(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

// ─── DateRangeFilter ─────────────────────────────────────────────────────────

/**
 * A compact date-range picker with Year / Month / Day modes.
 * Renders as a toggle button; clicking opens an inline dropdown.
 * Calls `onApply(from, to)` with ISO-8601 date strings (or nulls on clear).
 */
export default function DateRangeFilter({
  defaultLabel,
  accentColor = "#ffffff",
  onApply,
}: DateRangeFilterProps) {
  const [open, setOpen]               = useState(false);
  const [mode, setMode]               = useState<PickerMode>("month");
  const [activeLabel, setActiveLabel] = useState("");

  const [dayFrom, setDayFrom] = useState("");
  const [dayTo,   setDayTo]   = useState("");

  const [pickerYear, setPickerYear] = useState(CURRENT_YEAR);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commit = (from: string, to: string, label: string) => {
    setActiveLabel(label);
    onApply(from, to, label);
    setOpen(false);
  };

  const handleYearClick  = (year: number) =>
    commit(isoDate(year, 1, 1), isoDate(year, 12, 31), String(year));

  const handleMonthClick = (month: number) => {
    const ld = lastDay(pickerYear, month);
    commit(
      isoDate(pickerYear, month, 1),
      isoDate(pickerYear, month, ld),
      `${MONTH_ABBR[month - 1]} ${pickerYear}`
    );
  };

  const handleDayApply = () => {
    if (!dayFrom || !dayTo) return;
    commit(dayFrom, dayTo, `${dayFrom} – ${dayTo}`);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveLabel("");
    setDayFrom("");
    setDayTo("");
    onApply(null, null, "");
  };

  const hasActive   = !!activeLabel;
  const buttonLabel = hasActive ? activeLabel : defaultLabel;

  const yearList = Array.from(
    { length: CURRENT_YEAR - 2009 },
    (_, i) => CURRENT_YEAR - i
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">

      {/* Toggle button — border/text color driven by accentColor prop when active */}
      <button
        aria-pressed={hasActive}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="bg-transparent border text-[10px] font-mono tracking-[0.1em] uppercase px-2.5 py-[5px] rounded-sm cursor-pointer transition-colors whitespace-nowrap hover:border-slate-600 hover:text-zinc-300"
        style={{
          borderColor: hasActive ? accentColor : "#1e293b",  /* slate-800 */
          color:       hasActive ? accentColor : "#71717a",  /* zinc-500  */
        }}
      >
        {hasActive ? "▸ " : ""}{buttonLabel}
      </button>

      {/* Clear × */}
      {hasActive && (
        <button
          onClick={handleClear}
          aria-label={`Clear ${defaultLabel}`}
          className="bg-transparent border-none text-[15px] leading-none px-[2px] cursor-pointer"
          style={{ color: accentColor }}
        >
          ×
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label={`Select ${defaultLabel}`}
          className="absolute top-[calc(100%+8px)] left-0 w-[220px] bg-slate-900 border border-slate-700 rounded z-50 shadow-[0_12px_40px_rgba(0,0,0,0.7)] animate-fade-down"
        >

          {/* Mode tabs */}
          <div className="flex border-b border-slate-800">
            {(["year", "month", "day"] as PickerMode[]).map(t => (
              <button
                key={t}
                onClick={() => setMode(t)}
                className="flex-1 bg-transparent border-none py-1.5 text-[10px] uppercase tracking-[0.05em] font-mono cursor-pointer transition-colors"
                style={{
                  borderBottom: mode === t ? `1px solid ${accentColor}` : "1px solid transparent",
                  color:        mode === t ? accentColor : "#52525b",  /* zinc-600 */
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Year picker ── */}
          {mode === "year" && (
            <div className="grid grid-cols-3 gap-1.5 p-3 max-h-[200px] overflow-y-auto">
              {yearList.map(y => (
                <button
                  key={y}
                  onClick={() => handleYearClick(y)}
                  className="bg-transparent border border-slate-800 rounded text-zinc-400 font-mono text-[11px] py-[5px] cursor-pointer w-full hover:border-slate-600 hover:text-zinc-200 transition-colors"
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Month picker ── */}
          {mode === "month" && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <button
                  onClick={() => setPickerYear(y => y - 1)}
                  className="bg-transparent border-none text-zinc-700 text-sm cursor-pointer px-2 leading-none hover:text-zinc-400 transition-colors"
                >
                  ‹
                </button>
                <span className="font-mono text-[12px] text-zinc-400">{pickerYear}</span>
                <button
                  onClick={() => setPickerYear(y => Math.min(y + 1, CURRENT_YEAR))}
                  disabled={pickerYear >= CURRENT_YEAR}
                  className="bg-transparent border-none text-zinc-700 text-sm cursor-pointer px-2 leading-none hover:text-zinc-400 transition-colors disabled:opacity-30 disabled:cursor-default"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_ABBR.map((name, i) => {
                  const m = i + 1;
                  const isFuture = pickerYear === CURRENT_YEAR && m > new Date().getMonth() + 1;
                  return (
                    <button
                      key={name}
                      onClick={() => handleMonthClick(m)}
                      disabled={isFuture}
                      className="bg-transparent border border-slate-800 rounded text-zinc-400 font-mono text-[11px] py-1.5 cursor-pointer hover:border-slate-600 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-default"
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Day picker ── */}
          {mode === "day" && (
            <div className="pt-3 px-3.5 pb-3.5 flex flex-col gap-3">
              {(
                [
                  { id: "from", label: "From", value: dayFrom, setter: setDayFrom, max: dayTo || undefined, min: undefined },
                  { id: "to",   label: "To",   value: dayTo,   setter: setDayTo,   min: dayFrom || undefined, max: undefined },
                ] as const
              ).map(({ id, label, value, setter, min, max }) => (
                <label key={id} className="flex flex-col gap-1">
                  <span className="text-[9px] text-zinc-600 font-mono tracking-[0.1em] uppercase">
                    {label}
                  </span>
                  <input
                    type="date"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    min={min}
                    max={max}
                    aria-label={`${defaultLabel} ${label.toLowerCase()} date`}
                    className="bg-slate-950 border border-slate-700 rounded-sm text-zinc-200 py-1.5 px-2 text-[11px] font-mono w-full"
                    style={{ colorScheme: "dark" }}
                  />
                </label>
              ))}

              <button
                onClick={handleDayApply}
                disabled={!dayFrom || !dayTo}
                className="mt-0.5 text-[10px] tracking-[0.1em] uppercase font-mono py-2 rounded-sm transition-all enabled:bg-slate-950 enabled:border enabled:border-slate-600 enabled:text-violet-300 enabled:cursor-pointer disabled:bg-slate-900 disabled:border disabled:border-slate-800 disabled:text-zinc-700 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
