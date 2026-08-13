import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Wrap the whole app with this so any page can check "who is logged in?"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email, role }
  const [loading, setLoading] = useState(true);

  // On first load, check if a session was saved from before (page refresh)
  useEffect(() => {
    const saved = localStorage.getItem("bloodbridge_user");
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("bloodbridge_user", JSON.stringify(userData));
    localStorage.setItem("bloodbridge_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("bloodbridge_user");
    localStorage.removeItem("bloodbridge_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Use this in any component: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}