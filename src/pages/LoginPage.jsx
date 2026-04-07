const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const handleLogin = () => {
    // Redirect to the .NET API which kicks off the Strava OAuth flow
    window.location.href = `${API_URL}/api/auth/login`;
  };

  return (
    <div style={{
      background: "#07070f",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e0e0e0",
      gap: 24,
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em" }}>
        Cycling Analyzer
      </h1>
      <p style={{ fontSize: 13, color: "#555" }}>
        Connect your Strava account to get started
      </p>
      <button
        onClick={handleLogin}
        style={{
          background: "#fc4c02",
          border: "none",
          color: "#fff",
          padding: "12px 32px",
          borderRadius: 4,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.08em",
        }}
      >
        Connect with Strava
      </button>
    </div>
  );
}