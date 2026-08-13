import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  { value: "donor", label: "Donor" },
  { value: "patient", label: "Individual / Patient" },
  { value: "hospital", label: "Hospital" },
  { value: "bloodbank", label: "Blood Bank" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function Signup() {
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    name: "",       // used for donor's own name
    orgName: "",     // used for hospital/bloodbank name
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleClick = (value) => {
    if (value === "patient") {
      navigate("/request-blood");
    } else {
      setRole(value);
    }
  };

  const isOrg = role === "hospital" || role === "bloodbank";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // For org roles, the org name IS the account name — no separate contact person field.
      const payload = {
        ...form,
        name: isOrg ? form.orgName : form.name,
        role,
      };
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

  if (!role) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 bg-gradient-to-br from-red-100 via-red-50 to-rose-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">I am a...</h2>
        <p className="text-gray-500 mb-8">Choose how you'll use BloodBridge</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRoleClick(r.value)}
              className="bg-white shadow-sm border border-gray-200 rounded-lg py-6 px-4 text-center hover:bg-red-500 hover:border-red-500 hover:shadow-md transition group"
            >
              <span className="font-medium text-gray-700">{r.label}</span>
              {r.value === "patient" && (
                <span className="block text-xs text-gray-400 mt-1">No account needed</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-red-100 via-red-50 to-rose-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm border border-gray-100"
      >
        <button
          type="button"
          onClick={() => setRole("")}
          className="text-sm text-gray-400 mb-4 hover:text-gray-600"
        >
          ← change role
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Sign up as {ROLES.find((r) => r.value === role).label}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded my-4">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {isOrg ? (
            <input
              name="orgName"
              placeholder={role === "hospital" ? "Hospital name" : "Blood bank name"}
              required
              value={form.orgName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          ) : (
            <input
              name="name"
              placeholder="Full name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <input
            name="phone"
            placeholder="Contact number"
            required
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          {role === "donor" && (
            <select
              name="bloodGroup"
              required
              value={form.bloodGroup}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-600"
            >
              <option value="">Blood group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          )}

          <input
            name={isOrg ? "address" : "city"}
            placeholder={isOrg ? "Address" : "City"}
            required
            value={isOrg ? form.address : form.city}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-60 mt-6"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-red-600 font-medium">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}