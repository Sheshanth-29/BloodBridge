import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// Key used to remember the active request ID across page refreshes
const PENDING_KEY = "bloodbridge_pending_request_id";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function RequestBlood() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    units: 1,
  });

  // Email OTP — real, hits backend
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── If there's already a pending/active request (e.g. after browser refresh),
  //    skip the form and jump straight to the tracking page.
  useEffect(() => {
    const savedId = localStorage.getItem(PENDING_KEY);
    if (savedId) navigate(`/track/${savedId}`, { replace: true });
  }, [navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const sendEmailOtp = async () => {
    if (!form.email) return;
    setEmailError("");
    setEmailLoading(true);
    try {
      await api.post("/otp/send-email", { email: form.email });
      setEmailOtpSent(true);
    } catch (err) {
      setEmailError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    setEmailError("");
    setEmailLoading(true);
    try {
      await api.post("/otp/verify-email", { email: form.email, otp: emailOtp });
      setEmailVerified(true);
    } catch (err) {
      setEmailError(err.response?.data?.message || "Incorrect OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/requests", form);
      // Persist ID so a browser refresh on /request-blood returns to this request
      localStorage.setItem(PENDING_KEY, res.data.id);
      navigate(`/track/${res.data.id}`, { state: { request: res.data } });
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please try again.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-red-100 via-red-50 to-rose-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-md border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Request Blood</h2>
        <p className="text-sm text-gray-500 mb-6">No account needed. Verify your email to submit.</p>

        <div className="space-y-3">
          <input
            name="name"
            placeholder="Patient's name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <input
            name="phone"
            placeholder="Mobile number (10 digits)"
            required
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            title="Enter a valid 10-digit mobile number"
            value={form.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setForm({ ...form, phone: digits });
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          {form.phone.length > 0 && form.phone.length < 10 && (
            <p className="text-xs text-red-400 -mt-1 pl-1">
              {10 - form.phone.length} more digit{10 - form.phone.length !== 1 ? "s" : ""} needed
            </p>
          )}
          {form.phone.length === 10 && (
            <p className="text-xs text-green-500 -mt-1 pl-1">✓ Valid mobile number</p>
          )}

          {/* Email OTP block */}
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              disabled={emailOtpSent}
              value={form.email}
              onChange={handleChange}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100"
            />
            {!emailOtpSent && (
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={emailLoading}
                className="bg-gray-800 text-white px-4 rounded-md text-sm whitespace-nowrap disabled:opacity-60"
              >
                {emailLoading ? "Sending..." : "Send OTP"}
              </button>
            )}
          </div>
          {emailOtpSent && !emailVerified && (
            <div className="flex gap-2">
              <input
                placeholder="Enter email OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={verifyEmailOtp}
                disabled={emailLoading}
                className="bg-green-600 text-white px-4 rounded-md text-sm disabled:opacity-60"
              >
                {emailLoading ? "..." : "Verify"}
              </button>
            </div>
          )}
          {emailVerified && <p className="text-sm text-green-600">✓ Email verified</p>}
          {emailError && <p className="text-sm text-red-600">{emailError}</p>}

          <input
            name="address"
            placeholder="Address"
            required
            value={form.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <select
            name="bloodGroup"
            required
            value={form.bloodGroup}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-600"
          >
            <option value="">Type of blood needed</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <div>
            <input
              type="number"
              name="units"
              min="1"
              placeholder="Units needed"
              value={form.units}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <p className="text-xs text-gray-400 mt-1">1 unit ≈ 450ml</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!emailVerified}
          className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          Submit Request
        </button>
        {!emailVerified && (
          <p className="text-xs text-gray-400 text-center mt-2">Verify your email to submit</p>
        )}
      </form>
    </div>
  );
}