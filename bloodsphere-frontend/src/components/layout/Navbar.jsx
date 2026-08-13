import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-tight">
        BloodBridge
      </Link>

      <div className="flex items-center gap-4">
        {!user && (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="bg-white text-red-600 px-4 py-1.5 rounded-md font-medium hover:bg-red-50">
              Sign Up
            </Link>
          </>
        )}

        {user && (
          <>
            <span className="text-sm opacity-90">
              {user.name} · <span className="capitalize">{user.role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-red-600 px-4 py-1.5 rounded-md font-medium hover:bg-red-50"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}