import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Customized,
} from "recharts";

import "./PowerCurve.css";
import { WATT_BANDS, BAND_COLORS, DURATIONS, DURATION_LABELS, DURATION_INDEX } from "../constants/powerBands";
import { PRESETS, getCurveForPreset, getMockCustomCurve } from "../data/mockData";

// ─── Band fills via Customized (avoids ReferenceArea's infinite-dispatch bug) ─

function BandFills({ xAxisMap, yAxisMap, bandPairs, rowData }) {
  const yAxis = yAxisMap && Object.values(yAxisMap)[0];
  const xAxis = xAxisMap && Object.values(xAxisMap)[0];
  if (!yAxis?.scale || !xAxis?.scale || !rowData?.length) return null;

  const [xMin, xMax] = xAxis.scale.range();

  return (
    <g>
      {bandPairs.map(([lo, hi]) => {
        const loVal = rowData[0][lo];
        const hiVal = rowData[0][hi];
        if (loVal == null || hiVal == null) return null;
        const yTop    = yAxis.scale(hiVal);
        const yBottom = yAxis.scale(loVal);
        if (!isFinite(yTop) || !isFinite(yBottom)) return null;
        return (
          <rect
            key={`${lo}-${hi}`}
            x={xMin}
            width={xMax - xMin}
            y={yTop}
            height={Math.max(0, yBottom - yTop)}
            fill={BAND_COLORS[hi]}
            fillOpacity={0.35}
          />
        );
      })}
    </g>
  );
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

// Converts the API response curve array into the indexed format the chart expects
function buildCurrentCurve(apiCurve) {
  if (!apiCurve) return null;
  return DURATIONS.map(d => {
    const point = apiCurve.find(p => p.duration_seconds === d);
    return point ? point.watts : 0;
  });
}

function buildChartData(currentCurve, compareCurve, showBands, weightKg) {
  if (!currentCurve) return [];
  return DURATIONS.map((d, i) => {
    const row = {
      d,
      label: DURATION_LABELS[d],
      current: currentCurve[i],
      ...(compareCurve ? { compare: compareCurve[i] } : {}),
    };
    if (showBands) {
      Object.entries(WATT_BANDS).forEach(([band, vals]) => {
        row[band] = Math.round(vals[i] * weightKg * 10) / 10;
      });
    }
    return row;
  });
}

// ─── CurveDot — stable reference prevents recharts re-rendering all dots ──────

function CurveDot({ cx, cy, payload, breakthroughs }) {
  const isBt = breakthroughs.some(b => DURATION_LABELS[b.duration] === payload.label);
  if (!isBt) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#00e5a0" stroke="#07070f" strokeWidth={2} />;
}

// ─── Compare Selector ─────────────────────────────────────────────────────────

function CompareSelector({ selected, customRange, onSelect, onClear }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("preset");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePresetClick = (id) => { onSelect(id, null); setOpen(false); };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    onSelect("custom", { from: customFrom, to: customTo });
    setOpen(false);
  };

  const selectedPreset = PRESETS.find(p => p.id === selected);
  const buttonLabel = selected
    ? selected === "custom"
      ? `${customRange?.from} – ${customRange?.to}`
      : selectedPreset?.label
    : "Compare to…";

  return (
    <div ref={ref} className="compare-selector">
      <button
        className="toggle-btn"
        aria-pressed={!!selected}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={{ whiteSpace: "nowrap" }}
      >
        {selected ? "▸ " : "+ "}{buttonLabel}
      </button>

      {selected && (
        <button onClick={onClear} aria-label="Remove comparison" className="compare-selector__clear">
          ×
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Select comparison period" className="compare-dropdown">
          <div className="compare-dropdown__tabs">
            {[{ id: "preset", label: "Quick Select" }, { id: "custom", label: "Date Range" }].map(t => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`compare-dropdown__tab${mode === t.id ? " compare-dropdown__tab--active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "preset" && (
            <ul role="listbox" aria-label="Period presets" className="compare-dropdown__list">
              {PRESETS.map(p => (
                <li key={p.id} role="option" aria-selected={selected === p.id}>
                  <button
                    onClick={() => handlePresetClick(p.id)}
                    className={`compare-dropdown__option${selected === p.id ? " compare-dropdown__option--selected" : ""}`}
                  >
                    <span className="compare-dropdown__option-label">{p.label}</span>
                    <span
                      className="compare-dropdown__option-range"
                      style={{ color: p.id === "alltime" ? "#00e5a044" : "#3a3a4a" }}
                    >
                      {p.id === "alltime" ? "all records" : `${p.from} – ${p.to}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mode === "custom" && (
            <div className="compare-dropdown__custom">
              <p className="compare-dropdown__hint">
                Pulls the best effort curve across all rides in the selected window.
              </p>
              {[
                { id: "from", label: "From", value: customFrom, setter: setCustomFrom, max: customTo || undefined, min: undefined },
                { id: "to", label: "To", value: customTo, setter: setCustomTo, min: customFrom || undefined, max: undefined },
              ].map(({ id, label, value, setter, min, max }) => (
                <label key={id} className="compare-dropdown__date-label">
                  <span className="compare-dropdown__date-field-label">{label}</span>
                  <input
                    type="date"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    min={min}
                    max={max}
                    aria-label={`Comparison range ${label.toLowerCase()} date`}
                    className="compare-dropdown__date-input"
                  />
                </label>
              ))}
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="compare-dropdown__apply"
              >
                Apply range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BreakthroughToast({ items, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!items.length) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="New power records"
      className={`bt-toast${visible ? " bt-toast--visible" : ""}`}
    >
      {items.map(b => (
        <div key={b.duration} className="bt-toast__item">
          <span className="bt-toast__badge">▲ New Record</span>
          <span className="bt-toast__text">{b.label} — {b.watts}W — {b.date}</span>
          <button
            onClick={() => onDismiss(b.duration)}
            aria-label={`Dismiss ${b.label} notification`}
            className="bt-toast__dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

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

function CustomTooltip({ active, payload, label, showWkg, compareLabel, weightKg }) {
  if (!active || !payload?.length) return null;

  const cur = payload.find(p => p.dataKey === "current");
  const cmp = payload.find(p => p.dataKey === "compare");
  const delta = cur && cmp ? (cur.value - cmp.value).toFixed(1) : null;

  return (
    <div role="tooltip" className="pc-tooltip">
      <div className="pc-tooltip__label">{label}</div>

      {cur && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">Current</span>
          <span className="pc-tooltip__val">{cur.value}W</span>
        </div>
      )}

      {showWkg && cur && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">W/kg</span>
          <span className="pc-tooltip__val pc-tooltip__val--wkg">
            {(cur.value / weightKg).toFixed(2)}
          </span>
        </div>
      )}

      {cmp && (
        <div className="pc-tooltip__row">
          <span className="pc-tooltip__key">{compareLabel ?? "Compare"}</span>
          <span className="pc-tooltip__val pc-tooltip__val--muted">{cmp.value}W</span>
        </div>
      )}

      {delta !== null && (
        <div
          className="pc-tooltip__delta"
          style={{ color: parseFloat(delta) >= 0 ? "#00e5a0" : "#ff6b6b" }}
        >
          {parseFloat(delta) >= 0 ? "+" : ""}{delta}W vs {compareLabel ?? "compare"}
        </div>
      )}
    </div>
  );
}

function BandLegend({ visible, onToggle }) {
  return (
    <div className="pc-band-legend">
      {Object.keys(WATT_BANDS).map(band => (
        <button
          key={band}
          onClick={() => onToggle(band)}
          aria-pressed={visible.has(band)}
          aria-label={`Toggle ${band} W/kg band`}
          className="band-legend__btn"
        >
          <span
            className="band-legend__swatch"
            style={{
              background: visible.has(band) ? BAND_COLORS[band] : "transparent",
              border: `1px solid ${BAND_COLORS[band]}`,
            }}
          />
          <span
            className="band-legend__label"
            style={{ color: visible.has(band) ? "#aaa" : "#444" }}
          >
            {band}
          </span>
        </button>
      ))}
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

// athleteWeightKg — from Strava athlete profile via the API
// apiCurve        — array of { duration_seconds, watts, watts_per_kg } from the Rust engine
// breakthroughs   — array of { duration, label, watts, date } PRs from the API
// isLoading       — true while the API call is in flight
// error           — error message string if the API call failed
export default function PowerCurve({
  athleteWeightKg = 70,
  apiCurve = null,
  isLoading = false,
  error = null,
}) {
  const [showBands, setShowBands] = useState(true);
  const [showWkg, setShowWkg] = useState(false);
  const [visibleBands, setVisibleBands] = useState(new Set(["Cat 4", "Cat 3", "Cat 2", "Cat 1"]));
  const [breakthroughs, setBreakthroughs] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [compareId, setCompareId] = useState(null);
  const [compareCustomRange, setCompareCustomRange] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Keep breakthroughs in sync if the prop changes (e.g. after a sync)
  useEffect(() => {
    setBreakthroughs(breakthroughs);
  }, [breakthroughs]);

  const handleCompareSelect = useCallback((id, customRange) => {
    setCompareId(id);
    setCompareCustomRange(customRange);
  }, []);

  const handleCompareClear = useCallback(() => {
    setCompareId(null);
    setCompareCustomRange(null);
  }, []);

  // Convert the API curve array into the indexed array the chart uses
  const currentCurve = useMemo(() => buildCurrentCurve(apiCurve), [apiCurve]);

  // Compare curve still uses mock data for historical periods until the API supports it
  const compareCurve = useMemo(() => {
    if (!compareId) return null;
    if (compareId === "custom") return getMockCustomCurve();
    return getCurveForPreset(compareId);
  }, [compareId]);

  const compareLabel = useMemo(() => {
    if (!compareId) return null;
    if (compareId === "custom") {
      return compareCustomRange
        ? `${compareCustomRange.from} – ${compareCustomRange.to}`
        : "Custom range";
    }
    return PRESETS.find(p => p.id === compareId)?.label ?? null;
  }, [compareId, compareCustomRange]);

  const isAllTime = compareId === "alltime";

  const data = useMemo(
    () => buildChartData(currentCurve, compareCurve, showBands, athleteWeightKg),
    [currentCurve, compareCurve, showBands, athleteWeightKg]
  );

  const toggleBand = useCallback(band => {
    setVisibleBands(prev => {
      const next = new Set(prev);
      next.has(band) ? next.delete(band) : next.add(band);
      return next;
    });
  }, []);

  // Derived stats from the real curve data
  const ftp = currentCurve
    ? Math.round(currentCurve[DURATION_INDEX[3600]] * 0.95)
    : 0;
  const map5m = currentCurve ? currentCurve[DURATION_INDEX[300]] : 0;
  const sprint = currentCurve ? currentCurve[DURATION_INDEX[5]] : 0;
  const wkgFtp = athleteWeightKg > 0 ? (ftp / athleteWeightKg).toFixed(2) : "0.00";

  const bandKeys = Object.keys(WATT_BANDS).filter(b => visibleBands.has(b));
  const bandPairs = bandKeys.slice(0, -1).map((b, i) => [b, bandKeys[i + 1]]);

  // Explicit Y-axis domain prevents recharts from auto-calculating it on every
  // render, which is the root cause of the ReferenceArea infinite-update loop.
  const yDomain = useMemo(() => {
    if (!data.length) return [0, 800];
    let max = 0;
    data.forEach(row => {
      Object.entries(row).forEach(([k, v]) => {
        if (k !== "d" && k !== "label" && typeof v === "number" && v > max) max = v;
      });
    });
    return [0, Math.ceil(max * 1.1)];
  }, [data]);

  const renderDot = useCallback(
    props => <CurveDot {...props} breakthroughs={breakthroughs} />,
    [breakthroughs]
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!currentCurve) return null;

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

        {/* Controls */}
        <div className="pc-controls">
          <CompareSelector
            selected={compareId}
            customRange={compareCustomRange}
            onSelect={handleCompareSelect}
            onClear={handleCompareClear}
          />

          <div className="pc-controls__separator" role="separator" />

          <button className="toggle-btn" aria-pressed={showBands} onClick={() => setShowBands(v => !v)}>
            W/kg Bands
          </button>
          <button className="toggle-btn" aria-pressed={showWkg} onClick={() => setShowWkg(v => !v)}>
            W/kg Tooltip
          </button>

          <div className="pc-controls__legend">
            <div className="pc-legend__item">
              <span className="pc-legend__line" aria-hidden="true" />
              <span className="pc-legend__label">Current</span>
            </div>
            {compareCurve && (
              <div className="pc-legend__item">
                <span
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 0,
                    display: "inline-block",
                    borderTop: `1.5px dashed ${isAllTime ? "#00e5a066" : "#5a5a7a"}`,
                  }}
                />
                <span
                  className="pc-legend__label"
                  style={{ color: isAllTime ? "#00e5a055" : "#5a5a7a" }}
                >
                  {compareLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Band toggles */}
        {showBands && <BandLegend visible={visibleBands} onToggle={toggleBand} />}

        {/* Chart */}
        <div className="pc-chart-wrap">
          <BreakthroughToast
            items={breakthroughs}
            onDismiss={d => setBreakthroughs(p => p.filter(b => b.duration !== d))}
          />

          <div aria-hidden="true" className="pc-chart__y-label">Watts</div>

          <div role="img" aria-label={`Power curve chart. Current: ${sprint}W sprint, ${map5m}W at 5 min, FTP ~${ftp}W.${compareLabel ? ` Comparison overlay: ${compareLabel}.` : ""}`}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 48 }}>

                {showBands && (
                  <Customized
                    component={BandFills}
                    bandPairs={bandPairs}
                    rowData={data}
                  />
                )}

                {breakthroughs.map(b => (
                  <ReferenceLine
                    key={b.duration}
                    x={DURATION_LABELS[b.duration]}
                    stroke="#00e5a0"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    label={{ value: "▲", position: "top", fill: "#00e5a0", fontSize: 10 }}
                  />
                ))}

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
                <Tooltip
                  content={
                    <CustomTooltip
                      showWkg={showWkg}
                      compareLabel={compareLabel}
                      weightKg={athleteWeightKg}
                    />
                  }
                />

                {showBands && bandKeys.map(band => (
                  <Line
                    key={band}
                    type="monotone"
                    dataKey={band}
                    stroke={BAND_COLORS[band]}
                    strokeWidth={0.5}
                    strokeDasharray="2 4"
                    dot={false}
                    isAnimationActive={false}
                    opacity={0.7}
                    aria-hidden="true"
                  />
                ))}

                {compareCurve && (
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke={isAllTime ? "#00e5a0" : "#5a5a7a"}
                    strokeOpacity={isAllTime ? 0.5 : 0.85}
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                    isAnimationActive
                    animationDuration={700}
                    name={compareLabel}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={renderDot}
                  activeDot={{ r: 4, fill: "#fff", strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                  name="Current"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* W/kg category bar */}
        {showBands && (
          <div role="complementary" aria-label="W/kg category reference bands" className="pc-band-bar">
            {Object.entries(WATT_BANDS).map(([band, values], i) => {
              const wkg5m = values[DURATION_INDEX[300]].toFixed(1);
              const nextWkg = Object.values(WATT_BANDS)[i + 1]?.[DURATION_INDEX[300]];
              const isUser =
                currentCurve[DURATION_INDEX[300]] / athleteWeightKg >= parseFloat(wkg5m) &&
                currentCurve[DURATION_INDEX[300]] / athleteWeightKg < (nextWkg ?? 99);

              return (
                <div
                  key={band}
                  className="pc-band-bar__cell"
                  style={{
                    background: isUser ? "#0d1a2a" : "transparent",
                    borderRight: i < 5 ? "1px solid #1a1a28" : "none",
                  }}
                >
                  <div className="pc-band-bar__name" style={{ color: isUser ? "#6ec6ff" : "#444" }}>
                    {band}
                  </div>
                  <div className="pc-band-bar__wkg" style={{ color: isUser ? "#c0e0ff" : "#555" }}>
                    {wkg5m}+ W/kg
                  </div>
                  <div className="pc-band-bar__duration">@ 5 min</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="pc-footer">
          <p className="pc-footer__text">
            Power curve calculated from {apiCurve?.length ?? 0} data points
          </p>
          <p className="pc-footer__text">
            W/kg bands based on ≥5 min efforts · Body weight {athleteWeightKg}kg
          </p>
        </div>

      </div>
    </div>
  );
}
