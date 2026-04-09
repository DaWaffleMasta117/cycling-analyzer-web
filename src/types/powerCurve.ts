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

// ─── Component prop types ─────────────────────────────────────────────────────

export interface SyncBarProps {
  syncing: boolean;
  syncMessage: string | null;
  onSync: () => void;
  onLogout: () => void;
}

export interface StatPillsProps {
  ftp: number;
  /** Pre-computed FTP / weight_kg, already formatted as a 2-decimal string. */
  wkgFtp: string;
  map5m: number;
  sprint: number;
}

export interface DateRangeFilterProps {
  defaultLabel: string;
  accentColor?: string;
  onApply: (from: string | null, to: string | null) => void;
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
  /** Used for the ARIA label on the chart container. */
  sprint: number;
  map5m: number;
  ftp: number;
}
