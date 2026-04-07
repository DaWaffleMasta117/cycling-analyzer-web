// ─── Mock Data ────────────────────────────────────────────────────────────────
// This entire file will be replaced when Strava API integration is wired up.
// All exports here mirror the shape the real API responses will return,
// so swapping in real data requires no changes to the component.

import { DURATIONS, DURATION_INDEX } from "../constants/powerBands";

export const MOCK_WEIGHT_KG = 70;

// Deterministic seeded RNG — keeps mock curves stable across renders
function generateCurve(multiplier, seed = 1) {
  let s = seed;
  const rng = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return DURATIONS.map((d) =>
    Math.round(multiplier * Math.pow(d, -0.07) * (1 + 0.02 * (rng() - 0.5)) * MOCK_WEIGHT_KG * 10) / 10
  );
}

export const HISTORICAL_CURVES = {
  "Q1 2026": generateCurve(5.1, 1),
  "Q4 2025": generateCurve(4.7, 2),
  "Q3 2025": generateCurve(4.5, 3),
  "Q2 2025": generateCurve(4.3, 4),
  "Q1 2025": generateCurve(4.0, 5),
};

export const ALL_TIME_CURVE = DURATIONS.map((_, i) =>
  Math.max(...Object.values(HISTORICAL_CURVES).map((c) => c[i])) * 1.02
);

export const CURRENT_CURVE = HISTORICAL_CURVES["Q1 2026"];

export const MOCK_BREAKTHROUGHS = [
  {
    duration: 300,
    label: "5m PR",
    watts: CURRENT_CURVE[DURATION_INDEX[300]],
    date: "Mar 1, 2026",
  },
  {
    duration: 1200,
    label: "20m PR",
    watts: CURRENT_CURVE[DURATION_INDEX[1200]],
    date: "Feb 22, 2026",
  },
];

export const PRESETS = [
  { id: "q4-2025", label: "Q4 2025",       curveKey: "Q4 2025",   from: "Oct 2025", to: "Dec 2025" },
  { id: "q3-2025", label: "Q3 2025",       curveKey: "Q3 2025",   from: "Jul 2025", to: "Sep 2025" },
  { id: "q2-2025", label: "Q2 2025",       curveKey: "Q2 2025",   from: "Apr 2025", to: "Jun 2025" },
  { id: "q1-2025", label: "Q1 2025",       curveKey: "Q1 2025",   from: "Jan 2025", to: "Mar 2025" },
  { id: "alltime", label: "All-time best", curveKey: "__alltime",  from: null,       to: null       },
];

// Simulates a custom date range fetch — replace with real API call
export function getMockCustomCurve() {
  return generateCurve(4.55, 77);
}

export function getCurveForPreset(presetId) {
  const p = PRESETS.find((p) => p.id === presetId);
  if (!p) return null;
  if (p.curveKey === "__alltime") return ALL_TIME_CURVE;
  return HISTORICAL_CURVES[p.curveKey] ?? null;
}
