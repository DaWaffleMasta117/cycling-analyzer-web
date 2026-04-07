import { createContext, useContext, useState, useEffect } from "react";
import { isAuthenticated, clearToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount check if we already have a valid token
    if (isAuthenticated()) {
      // Decode the JWT payload to get athlete info
      // JWT is three base64 parts separated by dots — the middle is the payload
      const token = localStorage.getItem("jwt");
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAthlete({
        id: payload.athleteId,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
    }
    setLoading(false);
  }, []);

  const login = (jwt, athleteData) => {
    localStorage.setItem("jwt", jwt);
    setAthlete(athleteData);
  };

  const logout = () => {
    clearToken();
    setAthlete(null);
  };

  return (
    <AuthContext.Provider value={{ athlete, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  
  return context;
}