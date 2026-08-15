import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  return (
    <nav className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-1">
        {!isHome && (
          <>
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-red-700 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <Link
              to="/"
              title="Go home"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-red-700 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5" />
                <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
              </svg>
            </Link>
          </>
        )}
        <Link to="/" className="text-xl font-bold tracking-tight ml-2">
          BloodBridge
        </Link>
      </div>

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