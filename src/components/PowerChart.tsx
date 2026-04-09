import { useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import type { PowerChartProps } from "../types/powerCurve";

// ─── Constants ────────────────────────────────────────────────────────────────
// Tailwind v4 exposes every palette color as a CSS custom property on :root,
// so var(--color-*) works in SVG stroke/fill props just like any CSS color.

export const BEST_COLOR   = "var(--color-amber-500)";
const RANGE_B_COLOR       = "var(--color-emerald-400)";
const AXIS_COLOR          = "var(--color-slate-800)";
const TICK_COLOR          = "var(--color-zinc-700)";

// ─── CustomTooltip ────────────────────────────────────────────────────────────

interface CustomTooltipProps extends TooltipProps<number, string> {
  weightKg: number;
  hasCurveB: boolean;
  showBest: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
  weightKg,
  hasCurveB,
  showBest,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const a    = payload.find(p => p.dataKey === "curveA");
  const b    = payload.find(p => p.dataKey === "curveB");
  const best = showBest ? payload.find(p => p.dataKey === "curveBest") : null;

  const wkg = (watts: number): string | null =>
    weightKg > 0 ? (watts / weightKg).toFixed(2) : null;

  const aVal = a?.value ?? null;
  const bVal = b?.value ?? null;

  const deltaW   = aVal !== null && bVal !== null ? (aVal - bVal).toFixed(1) : null;
  const deltaWkg =
    aVal !== null && bVal !== null && weightKg > 0
      ? ((aVal - bVal) / weightKg).toFixed(2)
      : null;

  return (
    <div role="tooltip" className="bg-zinc-950 border border-slate-700 px-3.5 py-2.5 rounded min-w-[150px]">

      <div className="text-[10px] text-zinc-500 mb-1.5 font-mono tracking-[0.08em]">
        {label}
      </div>

      {/* Range A */}
      {a && aVal !== null && (
        <div className="flex justify-between gap-4 mb-[3px]">
          <span className="text-[11px] text-zinc-400">
            {hasCurveB ? "Range A" : "Watts"}
          </span>
          <span className="text-[11px] font-mono font-semibold text-white">
            {aVal}W
            {wkg(aVal) && (
              <span className="text-sky-300 font-normal"> · {wkg(aVal)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {/* Range B */}
      {b && bVal !== null && (
        <div className="flex justify-between gap-4 mb-[3px]">
          <span className="text-[11px] text-zinc-400">Range B</span>
          <span className="text-[11px] font-mono font-semibold text-emerald-400">
            {bVal}W
            {wkg(bVal) && (
              <span className="font-normal"> · {wkg(bVal)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {/* All Time Best */}
      {best && best.value !== undefined && (
        <div className="flex justify-between gap-4 mb-[3px]">
          <span className="text-[11px] text-zinc-400">Best</span>
          <span className="text-[11px] font-mono font-semibold text-amber-500">
            {best.value}W
            {wkg(best.value) && (
              <span className="font-normal"> · {wkg(best.value)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {/* A vs B delta */}
      {deltaW !== null && (
        <div
          className={`mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] font-mono ${
            parseFloat(deltaW) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {parseFloat(deltaW) >= 0 ? "+" : ""}{deltaW}W
          {deltaWkg && ` · ${parseFloat(deltaWkg) >= 0 ? "+" : ""}${deltaWkg} w/kg`}
          {" "}A vs B
        </div>
      )}
    </div>
  );
}

// ─── PowerChart ───────────────────────────────────────────────────────────────

/**
 * The Recharts power-curve chart with a custom tooltip.
 * Renders three optional lines: Range A (always), Range B (dashed emerald),
 * and All Time Best (dashed amber, toggled via `showBest`).
 */
export default function PowerChart({
  data,
  yDomain,
  curveB,
  curveBest,
  showBest,
  weightKg,
  sprint,
  map5m,
  ftp,
}: PowerChartProps) {
  const tooltipContent = useCallback(
    (props: TooltipProps<number, string>) => (
      <CustomTooltip
        {...props}
        weightKg={weightKg}
        hasCurveB={!!curveB}
        showBest={showBest && !!curveBest}
      />
    ),
    [weightKg, curveB, showBest, curveBest]
  );

  return (
    <div className="relative flex-1 min-h-0">

      {/* Rotated Y-axis label — inline transform required; CSS transform order matters */}
      <div
        className="absolute text-[9px] text-zinc-700 tracking-[0.1em] uppercase font-mono whitespace-nowrap"
        style={{ left: -12, top: "50%", transform: "rotate(-90deg) translateX(-50%)", transformOrigin: "center" }}
        aria-hidden="true"
      >
        Watts
      </div>

      <div
        role="img"
        aria-label={`Power curve chart. ${sprint}W sprint, ${map5m}W at 5 min, FTP ~${ftp}W.`}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 48 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: TICK_COLOR, fontFamily: "'DM Mono', monospace" }}
              axisLine={{ stroke: AXIS_COLOR }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 10, fill: TICK_COLOR, fontFamily: "'DM Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `${v}W`}
            />
            <Tooltip content={tooltipContent} />

            {/* All-time best — dashed amber-500, drawn first so other lines sit on top */}
            {showBest && curveBest && (
              <Line
                type="monotone"
                dataKey="curveBest"
                stroke={BEST_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: BEST_COLOR, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={600}
                name="All Time Best"
              />
            )}

            {/* Comparison curve B — dashed emerald-400 */}
            {curveB && (
              <Line
                type="monotone"
                dataKey="curveB"
                stroke={RANGE_B_COLOR}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4, fill: RANGE_B_COLOR, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={700}
                name="Range B"
              />
            )}

            {/* Primary curve A — solid white */}
            <Line
              type="monotone"
              dataKey="curveA"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#fff", strokeWidth: 0 }}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
              name="Range A"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
