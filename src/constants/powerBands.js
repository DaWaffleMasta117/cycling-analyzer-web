// W/kg values per category, indexed to match DURATIONS in mockData.js
// These are real-world racing category benchmarks — not mock data
export const WATT_BANDS = {
  "Cat 4":           [3.4, 4.2, 4.8, 5.1, 4.7, 4.4, 4.0, 3.7, 3.4, 3.2, 3.0, 2.8, 2.6, 2.3],
  "Cat 3":           [4.5, 5.5, 6.3, 6.8, 6.3, 5.9, 5.4, 5.0, 4.6, 4.3, 4.0, 3.8, 3.5, 3.1],
  "Cat 2":           [5.5, 6.6, 7.6, 8.2, 7.6, 7.1, 6.5, 6.0, 5.5, 5.2, 4.8, 4.5, 4.2, 3.7],
  "Cat 1":           [6.4, 7.6, 8.8, 9.5, 8.8, 8.2, 7.5, 6.9, 6.3, 5.9, 5.5, 5.2, 4.8, 4.3],
  "Pro Continental": [7.3, 8.7, 10.1, 10.9, 10.1, 9.4, 8.6, 7.9, 7.2, 6.8, 6.3, 5.9, 5.5, 4.9],
  "World Tour":      [8.5, 10.1, 11.7, 12.6, 11.7, 10.9, 10.0, 9.2, 8.4, 7.9, 7.3, 6.9, 6.4, 5.7],
};

export const BAND_COLORS = {
  "Cat 4":           "#3a3a4a",
  "Cat 3":           "#2d3748",
  "Cat 2":           "#1a3a5c",
  "Cat 1":           "#1a4a6e",
  "Pro Continental": "#1a5c7a",
  "World Tour":      "#1a6b6b",
};

// Duration axis — shared between chart and band calculations
export const DURATIONS = [1, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 10800, 21600];

export const DURATION_LABELS = {
  1: "1s", 5: "5s", 10: "10s", 30: "30s", 60: "1m", 120: "2m",
  300: "5m", 600: "10m", 1200: "20m", 1800: "30m",
  3600: "1h", 7200: "2h", 10800: "3h", 21600: "6h",
};

// O(1) index lookup — avoids repeated indexOf() calls at render time
export const DURATION_INDEX = Object.fromEntries(DURATIONS.map((d, i) => [d, i]));
