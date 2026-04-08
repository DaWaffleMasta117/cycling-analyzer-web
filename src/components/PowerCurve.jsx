import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./PowerCurve.css";
import { DURATIONS, DURATION_LABELS, DURATION_INDEX } from "../constants/powerBands";

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

// ─── Date Range Filter ────────────────────────────────────────────────────────

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENT_YEAR = new Date().getFullYear();

function pad2(n) { return String(n).padStart(2, "0"); }
function isoDate(y, m, d) { return `${y}-${pad2(m)}-${pad2(d)}`; }
function lastDay(y, m) { return new Date(y, m, 0).getDate(); } // m is 1-indexed

function DateRangeFilter({ defaultLabel, accentColor = "#ffffff", onApply }) {
  const [open, setOpen]       = useState(false);
  const [mode, setMode]       = useState("month"); // "year" | "month" | "day"
  const [activeLabel, setActiveLabel] = useState("");

  // Day mode
  const [dayFrom, setDayFrom] = useState("");
  const [dayTo,   setDayTo]   = useState("");

  // Month mode — which year is currently displayed in the picker
  const [pickerYear, setPickerYear] = useState(CURRENT_YEAR);

  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commit = (from, to, label) => {
    setActiveLabel(label);
    onApply(from, to);
    setOpen(false);
  };

  const handleYearClick = (year) => {
    commit(isoDate(year, 1, 1), isoDate(year, 12, 31), String(year));
  };

  const handleMonthClick = (month) => { // month 1-12
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

  const handleClear = (e) => {
    e.stopPropagation();
    setActiveLabel("");
    setDayFrom(""); setDayTo("");
    onApply(null, null);
  };

  const hasActive   = !!activeLabel;
  const buttonLabel = hasActive ? activeLabel : defaultLabel;

  // Build list of selectable years (current year → 2010)
  const yearList = Array.from(
    { length: CURRENT_YEAR - 2009 },
    (_, i) => CURRENT_YEAR - i
  );

  const tabStyle = (t) => ({
    flex: 1,
    background: "transparent",
    border: "none",
    borderBottom: mode === t ? `1px solid ${accentColor}` : "1px solid #1a1a28",
    color: mode === t ? accentColor : "#555",
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    padding: "6px 0",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  });

  const yearBtnStyle = (y) => ({
    background: "transparent",
    border: "1px solid #1a1a28",
    borderRadius: 3,
    color: "#aaa",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    padding: "5px 0",
    cursor: "pointer",
    width: "100%",
  });

  const monthBtnStyle = () => ({
    background: "transparent",
    border: "1px solid #1a1a28",
    borderRadius: 3,
    color: "#aaa",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    padding: "6px 0",
    cursor: "pointer",
  });

  const navBtnStyle = {
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 14,
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
  };

  return (
    <div ref={ref} className="compare-selector">
      <button
        className="toggle-btn"
        aria-pressed={hasActive}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={{ whiteSpace: "nowrap", borderColor: hasActive ? accentColor : undefined, color: hasActive ? accentColor : undefined }}
      >
        {hasActive ? "▸ " : ""}{buttonLabel}
      </button>

      {hasActive && (
        <button
          onClick={handleClear}
          aria-label={`Clear ${defaultLabel}`}
          className="compare-selector__clear"
          style={{ color: accentColor }}
        >
          ×
        </button>
      )}

      {open && (
        <div role="dialog" aria-label={`Select ${defaultLabel}`} className="compare-dropdown" style={{ width: 220 }}>

          {/* Mode tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1a1a28" }}>
            {["year", "month", "day"].map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setMode(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Year picker ── */}
          {mode === "year" && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6, padding: 12,
              maxHeight: 200, overflowY: "auto",
            }}>
              {yearList.map(y => (
                <button key={y} style={yearBtnStyle(y)} onClick={() => handleYearClick(y)}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Month picker ── */}
          {mode === "month" && (
            <div style={{ padding: 12 }}>
              {/* Year navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button style={navBtnStyle} onClick={() => setPickerYear(y => y - 1)}>‹</button>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#aaa" }}>
                  {pickerYear}
                </span>
                <button
                  style={{ ...navBtnStyle, opacity: pickerYear >= CURRENT_YEAR ? 0.3 : 1 }}
                  onClick={() => setPickerYear(y => Math.min(y + 1, CURRENT_YEAR))}
                  disabled={pickerYear >= CURRENT_YEAR}
                >
                  ›
                </button>
              </div>
              {/* 3 × 4 month grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {MONTH_ABBR.map((name, i) => {
                  const m = i + 1;
                  const isFuture = pickerYear === CURRENT_YEAR && m > new Date().getMonth() + 1;
                  return (
                    <button
                      key={name}
                      style={{ ...monthBtnStyle(), opacity: isFuture ? 0.3 : 1 }}
                      disabled={isFuture}
                      onClick={() => handleMonthClick(m)}
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
            <div className="compare-dropdown__custom" style={{ paddingTop: 12 }}>
              {[
                { id: "from", label: "From", value: dayFrom, setter: setDayFrom, max: dayTo || undefined, min: undefined },
                { id: "to",   label: "To",   value: dayTo,   setter: setDayTo,   min: dayFrom || undefined, max: undefined },
              ].map(({ id, label, value, setter, min, max }) => (
                <label key={id} className="compare-dropdown__date-label">
                  <span className="compare-dropdown__date-field-label">{label}</span>
                  <input
                    type="date"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    min={min}
                    max={max}
                    aria-label={`${defaultLabel} ${label.toLowerCase()} date`}
                    className="compare-dropdown__date-input"
                  />
                </label>
              ))}
              <button
                onClick={handleDayApply}
                disabled={!dayFrom || !dayTo}
                className="compare-dropdown__apply"
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, unit, highlight }) {
  return (
    <div className={`stat-pill${highlight ? " stat-pill--highlight" : ""}`}>
      <span className="stat-pill__label">{label}</span>
      <span className="stat-pill__value">
        {value}<span className="stat-pill__unit">{unit}</span>
      </span>
    </div>
  );
}

const BEST_COLOR = "#f59e0b";

function CustomTooltip({ active, payload, label, weightKg, hasCurveB, showBest }) {
  if (!active || !payload?.length) return null;

  const a    = payload.find(p => p.dataKey === "curveA");
  const b    = payload.find(p => p.dataKey === "curveB");
  const best = showBest ? payload.find(p => p.dataKey === "curveBest") : null;

  const wkg = (watts) => weightKg > 0 ? (watts / weightKg).toFixed(2) : null;

  const deltaW   = a && b ? (a.value - b.value).toFixed(1) : null;
  const deltaWkg = a && b && weightKg > 0
    ? ((a.value - b.value) / weightKg).toFixed(2)
    : null;

  return (
    <div role="tooltip" className="pc-tooltip">
      <div className="pc-tooltip__label">{label}</div>

      {a && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">{hasCurveB ? "Range A" : "Watts"}</span>
          <span className="pc-tooltip__val">
            {a.value}W
            {wkg(a.value) && (
              <span className="pc-tooltip__val--wkg"> · {wkg(a.value)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {b && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">Range B</span>
          <span className="pc-tooltip__val" style={{ color: "#00e5a0" }}>
            {b.value}W
            {wkg(b.value) && (
              <span className="pc-tooltip__val--wkg"> · {wkg(b.value)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {best && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">Best</span>
          <span className="pc-tooltip__val" style={{ color: BEST_COLOR }}>
            {best.value}W
            {wkg(best.value) && (
              <span className="pc-tooltip__val--wkg"> · {wkg(best.value)} w/kg</span>
            )}
          </span>
        </div>
      )}

      {deltaW !== null && (
        <div
          className="pc-tooltip__delta"
          style={{ color: parseFloat(deltaW) >= 0 ? "#00e5a0" : "#ff6b6b" }}
        >
          {parseFloat(deltaW) >= 0 ? "+" : ""}{deltaW}W
          {deltaWkg && ` · ${parseFloat(deltaWkg) >= 0 ? "+" : ""}${deltaWkg} w/kg`}
          {" "}A vs B
        </div>
      )}
    </div>
  );
}

// ─── Loading and error states ─────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="pc-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#555", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
        Loading power curve...
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="pc-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#ff6b6b", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
        {message}
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PowerCurve({
  athleteWeightKg = 70,
  apiCurveA    = null,
  apiCurveB    = null,
  apiCurveBest = null,
  isLoadingA   = false,
  isLoadingB   = false,
  errorA       = null,
  errorB       = null,
  onRangeAChange = null,
  onRangeBChange = null,
}) {
  const [mounted, setMounted]   = useState(false);
  const [showBest, setShowBest] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const curveA    = useMemo(() => buildCurveArray(apiCurveA),    [apiCurveA]);
  const curveB    = useMemo(() => buildCurveArray(apiCurveB),    [apiCurveB]);
  const curveBest = useMemo(() => buildCurveArray(apiCurveBest), [apiCurveBest]);

  // Only include best data in chart rows when the line is toggled on
  const data = useMemo(
    () => buildChartData(curveA, curveB, showBest ? curveBest : null),
    [curveA, curveB, curveBest, showBest]
  );

  // Derived stats always from curve A (primary)
  const ftp    = curveA ? Math.round(curveA[DURATION_INDEX[3600]] * 0.95) : 0;
  const map5m  = curveA ? curveA[DURATION_INDEX[300]] : 0;
  const sprint = curveA ? curveA[DURATION_INDEX[3]] : 0;
  const wkgFtp = athleteWeightKg > 0 ? (ftp / athleteWeightKg).toFixed(2) : "0.00";

  const yDomain = useMemo(() => {
    if (!data.length) return [0, 800];
    const max = data.reduce((m, row) => {
      return Math.max(m, row.curveA ?? 0, row.curveB ?? 0, row.curveBest ?? 0);
    }, 0);
    return [0, Math.ceil(max * 1.1)];
  }, [data]);

  const tooltipContent = useCallback(
    (props) => (
      <CustomTooltip
        {...props}
        weightKg={athleteWeightKg}
        hasCurveB={!!curveB}
        showBest={showBest && !!curveBest}
      />
    ),
    [athleteWeightKg, curveB, showBest, curveBest]
  );

  // Only block the whole view when the primary curve is loading for the first time
  if (isLoadingA && !curveA) return <LoadingState />;
  if (errorA) return <ErrorState message={errorA} />;
  if (!curveA) return null;

  return (
    <div className="pc-page">
      <div className={`pc-container${mounted ? " pc-container--mounted" : ""}`}>

        {/* Header */}
        <div className="pc-header">
          <div>
            <p className="pc-header__eyebrow">Power Curve · {athleteWeightKg} kg</p>
            <h1 className="pc-header__title">Mean Maximal Power</h1>
          </div>
          <div className="pc-header__pills" role="list" aria-label="Key power metrics">
            <div role="listitem"><StatPill label="FTP est." value={ftp} unit="W" /></div>
            <div role="listitem"><StatPill label="W/kg FTP" value={wkgFtp} unit="" /></div>
            <div role="listitem"><StatPill label="5m Peak" value={map5m} unit="W" highlight /></div>
            <div role="listitem"><StatPill label="Sprint" value={sprint} unit="W" /></div>
          </div>
        </div>

        {/* Date range controls */}
        <div className="pc-controls">
          <DateRangeFilter
            defaultLabel="Range A"
            accentColor="#ffffff"
            onApply={onRangeAChange}
          />

          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#333", alignSelf: "center", padding: "0 4px",
          }}>
            vs
          </span>

          <DateRangeFilter
            defaultLabel="Range B"
            accentColor="#00e5a0"
            onApply={onRangeBChange}
          />

          {/* Subtle loading indicator while comparison is fetching */}
          {isLoadingB && (
            <span style={{ color: "#444", fontFamily: "'DM Mono', monospace", fontSize: 10, alignSelf: "center" }}>
              loading…
            </span>
          )}

          {/* Error note for comparison range */}
          {errorB && !isLoadingB && (
            <span style={{ color: "#ff6b6b", fontFamily: "'DM Mono', monospace", fontSize: 10, alignSelf: "center" }}>
              {errorB}
            </span>
          )}

          {/* All-time best toggle */}
          {curveBest && (
            <>
              <div className="pc-controls__separator" role="separator" />
              <button
                className="toggle-btn"
                aria-pressed={showBest}
                onClick={() => setShowBest(v => !v)}
                style={{
                  borderColor: showBest ? BEST_COLOR : undefined,
                  color:       showBest ? BEST_COLOR : undefined,
                  whiteSpace: "nowrap",
                }}
              >
                All Time Best
              </button>
            </>
          )}

          {/* Legend */}
          {(curveB || showBest) && (
            <div className="pc-controls__legend" style={{ marginLeft: "auto" }}>
              <div className="pc-legend__item">
                <span className="pc-legend__line" aria-hidden="true" />
                <span className="pc-legend__label">Range A</span>
              </div>
              {curveB && (
                <div className="pc-legend__item">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 20, height: 0, display: "inline-block",
                      borderTop: "1.5px dashed #00e5a0",
                    }}
                  />
                  <span className="pc-legend__label" style={{ color: "#00e5a0" }}>Range B</span>
                </div>
              )}
              {showBest && (
                <div className="pc-legend__item">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 20, height: 0, display: "inline-block",
                      borderTop: `1.5px dashed ${BEST_COLOR}`,
                    }}
                  />
                  <span className="pc-legend__label" style={{ color: BEST_COLOR }}>All Time Best</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="pc-chart-wrap">
          <div aria-hidden="true" className="pc-chart__y-label">Watts</div>

          <div role="img" aria-label={`Power curve chart. ${sprint}W sprint, ${map5m}W at 5 min, FTP ~${ftp}W.`} style={{ height: "100%", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 48 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#444", fontFamily: "'DM Mono', monospace" }}
                  axisLine={{ stroke: "#1a1a28" }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: "#444", fontFamily: "'DM Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={v => `${v}W`}
                />
                <Tooltip content={tooltipContent} />

                {/* All-time best — dashed amber, drawn first so other lines sit on top */}
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

                {/* Comparison curve B — dashed teal */}
                {curveB && (
                  <Line
                    type="monotone"
                    dataKey="curveB"
                    stroke="#00e5a0"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                    activeDot={{ r: 4, fill: "#00e5a0", strokeWidth: 0 }}
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


      </div>
    </div>
  );
}
