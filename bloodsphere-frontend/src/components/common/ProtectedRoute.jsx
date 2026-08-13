import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Wrap any page that needs login with this.
// Optionally pass allowedRole="donor" to restrict it to just that role.
export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}