// ─── API shapes ───────────────────────────────────────────────────────────────

/** A single point on the Mean Maximal Power curve returned by the Rust API. */
export interface PowerCurvePoint {
  duration_seconds: number;
  watts: number;
  watts_per_kg: number;
}

/** Full response body from GET /power-curve */
export interface PowerCurveApiResponse {
  curve: PowerCurvePoint[];
  weight_kg: number;
}

// ─── Chart data shapes ────────────────────────────────────────────────────────

/**
 * A single row in the Recharts dataset — one per DURATIONS entry.
 * curveB and curveBest are optional because they may not be loaded.
 */
export interface ChartDataPoint {
  d: number;
  label: string;
  curveA: number;
  curveB?: number;
  curveBest?: number;
}

// ─── Ride stats API shape ─────────────────────────────────────────────────────

/** Response body from GET /ride-stats */
export interface RideStats {
  athlete_id: number;
  weight_kg: number;
  /** Highest AveragePowerWatts in the range. */
  peak_avg_watts: number;
  /** Highest NormalizedPowerWatts in the range (0 if no NP data). */
  peak_np_watts: number;
  /** Mean AveragePowerWatts in the range. */
  mean_avg_watts: number;
  /** Mean NormalizedPowerWatts in the range (0 if no NP data). */
  mean_np_watts: number;
}

// ─── Component prop types ─────────────────────────────────────────────────────

export interface SyncBarProps {
  syncing: boolean;
  syncMessage: string | null;
  onSync: () => void;
  onLogout: () => void;
}

export interface StatPillsProps {
  statsA: RideStats | null;
  statsB: RideStats | null;
}



export interface DateRangeFilterProps {
  defaultLabel: string;
  accentColor?: string;
  onApply: (from: string | null, to: string | null, label: string) => void;
}

export interface PowerChartProps {
  data: ChartDataPoint[];
  yDomain: [number, number];
  /** The processed watts array for curve B (null when not loaded). */
  curveB: number[] | null;
  /** The processed watts array for the all-time best (null when not loaded). */
  curveBest: number[] | null;
  showBest: boolean;
  weightKg: number;
  /** Human-readable label for Range A shown in the tooltip (e.g. "Jan 1 – Dec 31, 2024"). */
  rangeLabelA: string;
  /** Human-readable label for Range B shown in the tooltip. */
  rangeLabelB: string;
  /** Used for the ARIA label on the chart container. */
  sprint: number;
  map5m: number;
  ftp: number;
}
