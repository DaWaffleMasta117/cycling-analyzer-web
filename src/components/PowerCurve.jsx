import { useState, useEffect, useMemo } from "react";
import { DURATIONS, DURATION_LABELS, DURATION_INDEX } from "../constants/powerBands";
import StatPills from "./StatPills";
import DateRangeFilter from "./DateRangeFilter";
import PowerChart, { BEST_COLOR } from "./PowerChart";

// ─── Pure helpers ─────────────────────────────────────────────────────────────


function buildCurveArray(apiCurve) {
  if (!apiCurve) return null;
  return DURATIONS.map(d => {
    const point = apiCurve.find(p => p.duration_seconds === d);
    return point ? point.watts : 0;
  });
}

function buildChartData(curveA, curveB, curveBest) {
  if (!curveA) return [];
  return DURATIONS.map((d, i) => ({
    d,
    label: DURATION_LABELS[d],
    curveA: curveA[i],
    ...(curveB    ? { curveB:    curveB[i]    } : {}),
    ...(curveBest ? { curveBest: curveBest[i] } : {}),
  }));
}

// ─── Loading / error states ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="bg-zinc-950 h-screen flex items-center justify-center">
      <p className="text-zinc-600 font-mono text-xs">Loading power curve...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="bg-zinc-950 h-screen flex items-center justify-center">
      <p className="text-red-400 font-mono text-xs">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-zinc-950 h-screen flex items-center justify-center">
      <p className="text-zinc-600 font-mono text-xs">No rides yet — sync your rides to see your power curve.</p>
    </div>
  );
}

// ─── PowerCurve ───────────────────────────────────────────────────────────────

export default function PowerCurve({
  athleteWeightKg  = 70,
  apiCurveA        = null,
  apiCurveB        = null,
  apiCurveBest     = null,
  isLoadingA       = false,
  isLoadingB       = false,
  errorA           = null,
  errorB           = null,
  onRangeAChange   = null,
  onRangeBChange   = null,
  apiStatsA        = null,
  apiStatsB        = null,
  rangeA           = { from: null, to: null },
  rangeB           = { from: null, to: null },
}) {
  const [mounted,  setMounted]  = useState(false);
  const [showBest, setShowBest] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const curveA    = useMemo(() => buildCurveArray(apiCurveA),    [apiCurveA]);
  const curveB    = useMemo(() => buildCurveArray(apiCurveB),    [apiCurveB]);
  const curveBest = useMemo(() => buildCurveArray(apiCurveBest), [apiCurveBest]);

  const data = useMemo(
    () => buildChartData(curveA, curveB, showBest ? curveBest : null),
    [curveA, curveB, curveBest, showBest]
  );

  const ftp    = curveA ? Math.round(curveA[DURATION_INDEX[3600]] * 0.95) : 0;
  const map5m  = curveA ? curveA[DURATION_INDEX[300]]  : 0;
  const sprint = curveA ? curveA[DURATION_INDEX[3]]    : 0;
  const wkgFtp = athleteWeightKg > 0 ? (ftp / athleteWeightKg).toFixed(2) : "0.00";

  const yDomain = useMemo(() => {
    if (!data.length) return [0, 800];
    const max = data.reduce((m, row) =>
      Math.max(m, row.curveA ?? 0, row.curveB ?? 0, row.curveBest ?? 0), 0);
    return [0, Math.ceil(max * 1.1)];
  }, [data]);

  if (isLoadingA && !curveA) return <LoadingState />;
  if (errorA)                return <ErrorState message={errorA} />;
  if (!curveA)               return null;
  if (apiCurveA?.length === 0) return <EmptyState />;

  return (
    <div className="bg-zinc-950 h-screen flex flex-col overflow-hidden font-sans text-zinc-200">
      <div
        className={`max-w-[1100px] w-full mx-auto pt-16 px-6 pb-4 flex flex-col flex-1 min-h-0 transition-[opacity,transform] duration-500 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >

        {/* ── Header ── */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <p className="text-[10px] text-zinc-600 tracking-[0.18em] uppercase font-mono mb-1.5">
              Power Curve · {athleteWeightKg} kg
            </p>
            <h1 className="text-2xl font-light text-zinc-200 tracking-tight leading-none">
              Mean Maximal Power
            </h1>
          </div>
          <StatPills statsA={apiStatsA} statsB={apiStatsB} />
        </div>

        {/* ── Controls bar ── */}
        <div className="flex gap-2 mb-5 flex-wrap items-center">

          <DateRangeFilter
            defaultLabel="Range A"
            accentColor="#ffffff"
            onApply={onRangeAChange}
          />

          <span className="font-mono text-[11px] text-zinc-800 self-center px-1">vs</span>

          <DateRangeFilter
            defaultLabel="Range B"
            accentColor="#34d399"
            onApply={onRangeBChange}
          />

          {isLoadingB && (
            <span className="text-zinc-700 font-mono text-[10px] self-center">loading…</span>
          )}
          {errorB && !isLoadingB && (
            <span className="text-red-400 font-mono text-[10px] self-center">{errorB}</span>
          )}

          {/* All-time best toggle */}
          {curveBest && (
            <>
              <div className="w-px h-4 bg-slate-800 flex-shrink-0" role="separator" />
              <button
                aria-pressed={showBest}
                onClick={() => setShowBest(v => !v)}
                className={`bg-transparent border text-[10px] font-mono tracking-[0.1em] uppercase px-2.5 py-[5px] rounded-sm cursor-pointer transition-colors whitespace-nowrap hover:border-slate-600 hover:text-zinc-300 ${
                  showBest
                    ? "border-amber-500 text-amber-500 bg-slate-900"
                    : "border-slate-800 text-zinc-500"
                }`}
              >
                All Time Best
              </button>
            </>
          )}

          {/* Legend */}
          {(curveB || showBest) && (
            <div className="flex gap-4 items-center ml-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-white inline-block" aria-hidden="true" />
                <span className="text-[10px] text-zinc-700 font-mono">Range A</span>
              </div>
              {curveB && (
                <div className="flex items-center gap-1.5">
                  {/* 1.5px dashed — no Tailwind utility for fractional border width */}
                  <span
                    className="w-5 inline-block"
                    style={{ height: 0, borderTop: "1.5px dashed #34d399" }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-mono text-emerald-400">Range B</span>
                </div>
              )}
              {showBest && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 inline-block"
                    style={{ height: 0, borderTop: `1.5px dashed ${BEST_COLOR}` }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-mono text-amber-500">All Time Best</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Chart ── */}
        <PowerChart
          data={data}
          yDomain={yDomain}
          curveB={curveB}
          curveBest={curveBest}
          showBest={showBest}
          weightKg={athleteWeightKg}
          rangeLabelA={rangeA.label || "All time"}
          rangeLabelB={rangeB.label || "All time"}
          sprint={sprint}
          map5m={map5m}
          ftp={ftp}
        />

      </div>
    </div>
  );
}
