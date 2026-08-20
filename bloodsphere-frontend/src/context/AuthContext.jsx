import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Wrap the whole app with this so any page can check "who is logged in?"
export function AuthProvider({ children }) {
  // Initialize synchronously from localStorage — this prevents the brief
  // user=null flash on page refresh that was causing ProtectedRoute to redirect.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("bloodbridge_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

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