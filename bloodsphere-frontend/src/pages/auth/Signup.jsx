import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  Droplet, User, Building2, FlaskConical,
  Mail, Lock, Phone, MapPin, ArrowLeft,
  AlertCircle, ArrowRight
} from "lucide-react";

const ROLES = [
  { value: "donor", label: "Donor", icon: Droplet, desc: "Donate blood & save lives", color: "from-red-500 to-rose-600", shadow: "shadow-red-200" },
  { value: "patient", label: "Individual / Patient", icon: User, desc: "No account needed", color: "from-orange-500 to-amber-500", shadow: "shadow-amber-200" },
  { value: "hospital", label: "Hospital", icon: Building2, desc: "Request & manage blood supply", color: "from-blue-500 to-blue-600", shadow: "shadow-blue-200" },
  { value: "bloodbank", label: "Blood Bank", icon: FlaskConical, desc: "Manage inventory & donors", color: "from-purple-500 to-violet-600", shadow: "shadow-purple-200" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// ── Shared styled input with left icon ────────────────────────────────────
function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        {...props}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-white text-sm"
      />
    </div>
  );
}

// ── Shared styled select ────────────────────────────────────────────────
function StyledSelect({ icon: Icon, children, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />}
      <select
        {...props}
        className={`w-full ${Icon ? "pl-9" : "pl-4"} pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-white text-sm text-gray-700 appearance-none`}
      >
        {children}
      </select>
    </div>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────
function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-xl font-semibold hover:from-red-500 hover:to-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>{label} <ArrowRight size={16} /></>
      )}
    </button>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────
function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4 border border-red-100">
      <AlertCircle size={15} className="shrink-0" />
      {msg}
    </div>
  );
}

export default function Signup() {
  const [role, setRole] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "create" — login shows first

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Create-account form state
  const [form, setForm] = useState({
    name: "",
    orgName: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    city: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleClick = (value) => {
    if (value === "patient") {
      navigate("/request-blood");
    } else {
      setRole(value);
      setMode("login"); // always land on login first
    }
  };

  const isOrg = role === "hospital" || role === "bloodbank";

  // --- Login submit ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await api.post("/auth/login", loginForm);
      const { user, token } = res.data;
      login(user, token);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed. Check your details.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- Create account submit ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, name: isOrg ? form.orgName : form.name, role };
      const res = await api.post("/auth/signup", payload);
      const { user, token } = res.data;
      login(user, token);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Screen 1: role selection ─────────────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-[88vh] flex flex-col items-center justify-center px-6 bg-gradient-to-br from-red-50 via-rose-50 to-white">
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">I am a...</h2>
          <p className="text-gray-500">Choose how you'll use BloodBridge</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md animate-fade-in-up delay-100">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                onClick={() => handleRoleClick(r.value)}
                className="bg-white border border-gray-100 rounded-2xl py-7 px-4 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group shadow-sm"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${r.color} rounded-xl mb-3 shadow-md ${r.shadow} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
                {r.value === "patient" && (
                  <span className="block text-xs text-gray-400 mt-1">{r.desc}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const roleData = ROLES.find((r) => r.value === role);
  const RoleIcon = roleData.icon;
  const roleLabel = roleData.label;

  // ── Screen 2a: login form ────────────────────────────────────────────────
  if (mode === "login") {
    return (
      <div className="min-h-[88vh] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-red-50 via-rose-50 to-white">
        <div className="w-full max-w-sm">
          <form
            onSubmit={handleLoginSubmit}
            className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-red-100 animate-fade-in-up"
          >
            <button
              type="button"
              onClick={() => setRole("")}
              className="flex items-center gap-1 text-xs text-gray-400 mb-5 hover:text-gray-600 transition"
            >
              <ArrowLeft size={13} /> change role
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className={`w-14 h-14 bg-gradient-to-br ${roleData.color} rounded-2xl flex items-center justify-center shadow-md ${roleData.shadow} mb-3`}>
                <RoleIcon size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Login as {roleLabel}</h2>
            </div>

            <ErrorBanner msg={loginError} />

            <div className="space-y-3">
              <IconInput
                icon={Mail}
                type="email"
                placeholder="Email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
              <IconInput
                icon={Lock}
                type="password"
                placeholder="Password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            <SubmitBtn loading={loginLoading} label="Login" loadingLabel="Logging in..." />

            <p className="text-sm text-gray-500 mt-4 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("create")}
                className="text-red-600 font-semibold hover:text-red-700 transition"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Screen 2b: create account form ───────────────────────────────────────
  return (
    <div className="min-h-[88vh] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-red-50 via-rose-50 to-white">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-red-100 animate-fade-in-up"
        >
          <button
            type="button"
            onClick={() => setMode("login")}
            className="flex items-center gap-1 text-xs text-gray-400 mb-5 hover:text-gray-600 transition"
          >
            <ArrowLeft size={13} /> back to login
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className={`w-14 h-14 bg-gradient-to-br ${roleData.color} rounded-2xl flex items-center justify-center shadow-md ${roleData.shadow} mb-3`}>
              <RoleIcon size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Sign up as {roleLabel}</h2>
          </div>

          <ErrorBanner msg={error} />

          <div className="space-y-3">
            {isOrg ? (
              <IconInput
                icon={Building2}
                placeholder={role === "hospital" ? "Hospital name" : "Blood bank name"}
                required
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            ) : (
              <IconInput
                icon={User}
                placeholder="Full name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}

            <IconInput
              icon={Mail}
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <IconInput
              icon={Lock}
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <IconInput
              icon={Phone}
              placeholder="Contact number"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            {role === "donor" && (
              <StyledSelect
                icon={Droplet}
                required
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </StyledSelect>
            )}

            <IconInput
              icon={MapPin}
              placeholder={isOrg ? "Address" : "City"}
              required
              value={isOrg ? form.address : form.city}
              onChange={(e) => setForm({ ...form, [isOrg ? "address" : "city"]: e.target.value })}
            />
          </div>

          <SubmitBtn loading={loading} label="Create account" loadingLabel="Creating account..." />

          <p className="text-sm text-gray-500 mt-4 text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-red-600 font-semibold hover:text-red-700 transition"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}