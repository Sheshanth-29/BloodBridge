import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Droplet, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // This endpoint doesn't exist yet — we build it when we do the backend.
      const res = await api.post("/auth/login", form);
      const { user, token } = res.data;
      login(user, token);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-6 bg-gradient-to-br from-red-50 via-rose-50 to-white">
      <div className="w-full max-w-sm">
        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-red-100"
        >
          {/* Icon header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-md shadow-red-200 mb-4">
              <Droplet size={24} className="text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to BloodBridge</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-5 border border-red-100">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-white text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-white text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-xl font-semibold hover:from-red-500 hover:to-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>Login <ArrowRight size={16} /></>
            )}
          </button>

          <p className="text-sm text-gray-500 mt-5 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-red-600 font-semibold hover:text-red-700 transition">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}