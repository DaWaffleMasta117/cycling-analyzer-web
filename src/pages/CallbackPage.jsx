import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // The JWT comes back in the URL as a query param
    // We need to update AuthController to redirect here instead of returning JSON
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get("jwt");
    const athleteId = params.get("athleteId");
    const firstName = params.get("firstName");

    if (jwt) {
      login(jwt, { id: athleteId, firstName });
      navigate("/");
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen flex items-center justify-center font-mono text-xs text-zinc-200">
      Connecting to Strava...
    </div>
  );
}