// Duration axis — shared between chart and calculations
export const DURATIONS = [3, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 10800, 21600];

export const DURATION_LABELS = {
  3: "3s", 5: "5s", 10: "10s", 30: "30s", 60: "1m", 120: "2m",
  300: "5m", 600: "10m", 1200: "20m", 1800: "30m",
  3600: "1h", 7200: "2h", 10800: "3h", 21600: "6h",
};

// O(1) index lookup — avoids repeated indexOf() calls at render time
export const DURATION_INDEX = Object.fromEntries(DURATIONS.map((d, i) => [d, i]));
