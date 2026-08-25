import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Droplet, ArrowLeft, Home, LogOut, Bell, Building2, Heart, User } from "lucide-react";

const roleIcon = (role) => {
  if (role === "donor") return <Droplet size={14} className="inline mr-1" />;
  if (role === "hospital") return <Building2 size={14} className="inline mr-1" />;
  if (role === "bloodbank") return <Heart size={14} className="inline mr-1" />;
  return <User size={14} className="inline mr-1" />;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    // Navigate first so ProtectedRoute doesn't see user=null while still
    // mounted on a protected path and issue a second Navigate redirect —
    // that double-redirect was what caused the blank white flash.
    navigate("/login", { replace: true });
    // Small delay lets React finish the route transition before clearing auth
    setTimeout(() => logout(), 50);
  };

  const isHome = location.pathname === "/";
  // Hide the navbar on the full-screen delivery tracker so the map fills the viewport
  const isTracker = location.pathname.startsWith("/track/");

  // ⚠️ All hooks MUST be called before any conditional return (Rules of Hooks)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isTracker) return null;

  return (
    <nav
      className={`sticky top-0 z-50 text-white px-6 py-3 flex justify-between items-center transition-all duration-300 ${
        scrolled
          ? "bg-gradient-to-r from-red-800 to-rose-700 shadow-lg backdrop-blur-md"
          : "bg-gradient-to-r from-red-700 to-rose-600 shadow-md"
      }`}
    >
      {/* Left side */}
      <div className="flex items-center gap-1">
        {!isHome && (
          <>
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <Link
              to="/"
              title="Go home"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
            >
              <Home size={18} />
            </Link>
          </>
        )}
        <Link to="/" className="flex items-center gap-2 ml-2 group">
          <span className="bg-white/20 rounded-lg p-1.5 group-hover:bg-white/30 transition-colors">
            <Droplet size={16} className="text-white fill-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">BloodBridge</span>
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {!user && (
          <Link
            to="/signup"
            className="bg-white text-red-700 px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-red-50 hover:scale-105 transition-all duration-200 shadow-sm"
          >
            Get Started
          </Link>
        )}

        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 text-sm">
              {roleIcon(user.role)}
              <span className="font-medium">{user.name}</span>
              <span className="text-red-200">·</span>
              <span className="capitalize text-red-100 text-xs">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}