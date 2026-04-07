import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { usePowerCurve } from "./hooks/usePowerCurve";
import PowerCurve from "./components/PowerCurve";
import LoginPage from "./pages/LoginPage";
import CallbackPage from "./pages/CallbackPage";
import { syncRides } from "./services/api";

function Dashboard() {
  const { athlete, logout } = useAuth();
  const { data, loading, error, refetch } = usePowerCurve(athlete?.id);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncRides();
      setSyncMessage(`Synced ${result.newRidesCount} new ride${result.newRidesCount !== 1 ? "s" : ""}`);
      if (result.newRidesCount > 0) refetch();
    } catch (e) {
      setSyncMessage("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  }, [refetch]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        display: "flex", alignItems: "center", gap: 12,
        fontFamily: "'DM Mono', monospace", fontSize: 11,
      }}>
        {syncMessage && (
          <span style={{ color: syncMessage.startsWith("Sync failed") ? "#ff6b6b" : "#00e5a0" }}>
            {syncMessage}
          </span>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: "transparent", border: "1px solid #2a2a3a", color: "#888",
            padding: "6px 12px", borderRadius: 4, cursor: syncing ? "default" : "pointer",
            fontFamily: "inherit", fontSize: 11, opacity: syncing ? 0.5 : 1,
          }}
        >
          {syncing ? "Syncing…" : "Sync Rides"}
        </button>
        <button
          onClick={logout}
          style={{
            background: "transparent", border: "none", color: "#555",
            padding: "6px 4px", cursor: "pointer", fontFamily: "inherit", fontSize: 11,
          }}
        >
          Sign out
        </button>
      </div>
      <PowerCurve
        athleteWeightKg={data?.weight_kg ?? 70}
        apiCurve={data?.curve ?? null}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { athlete, loading } = useAuth();
  if (loading) return null;
  if (!athlete) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}