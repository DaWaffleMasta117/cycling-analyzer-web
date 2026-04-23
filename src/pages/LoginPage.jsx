import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const { athlete, loading } = useAuth();
  const navigate = useNavigate();

  // Already logged in — send straight to the dashboard
  useEffect(() => {
    if (!loading && athlete) {
      navigate("/", { replace: true });
    }
  }, [athlete, loading]);

  const handleLogin = () => {
    // Redirect to the .NET API which kicks off the Strava OAuth flow
    window.location.href = `${API_URL}/api/auth/login`;
  };

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center font-sans text-zinc-200 gap-6">
      <h1 className="text-[28px] font-light tracking-tight">
        Cycling Analyzer
      </h1>
      <p className="text-[13px] text-zinc-600">
        Connect your Strava account to get started
      </p>
      <button
        onClick={handleLogin}
        className="bg-[#fc4c02] text-white font-mono text-[13px] tracking-[0.08em] px-8 py-3 rounded cursor-pointer border-none hover:opacity-90 transition-opacity"
      >
        Connect with Strava
      </button>
    </div>
  );
}