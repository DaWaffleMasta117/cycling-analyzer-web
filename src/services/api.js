const API_URL = import.meta.env.VITE_API_URL;
const METRICS_URL = import.meta.env.VITE_METRICS_URL;

// Reads the JWT from localStorage
function getToken() {
  return localStorage.getItem("jwt");
}

// Saves the JWT to localStorage after login
export function saveToken(jwt) {
  localStorage.setItem("jwt", jwt);
}

// Clears the JWT on logout
export function clearToken() {
  localStorage.removeItem("jwt");
}

export function isAuthenticated() {
  return !!getToken();
}

// Base fetch wrapper that attaches the JWT automatically
async function apiFetch(url, options = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

// Trigger a ride sync for the current athlete
export async function syncRides() {
  return apiFetch(`${API_URL}/api/rides/sync`, { method: "POST" });
}

// Get paginated rides from the .NET API
export async function getRides(page = 1, pageSize = 20) {
  return apiFetch(`${API_URL}/api/rides?page=${page}&pageSize=${pageSize}`);
}

// Get power curve from the Rust metrics engine
export async function getPowerCurve(athleteId, from = null, to = null) {
  const params = new URLSearchParams({ athlete_id: athleteId });

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const response = await fetch(`${METRICS_URL}/power-curve?${params}`);
  if (!response.ok) throw new Error(`Metrics request failed: ${response.status}`);

  return response.json();
}