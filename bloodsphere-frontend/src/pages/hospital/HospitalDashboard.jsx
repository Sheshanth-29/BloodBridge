import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const MOCK_DELIVERY_MINUTES = 20;

function getEta(dispatchedAt) {
  if (!dispatchedAt) return null;
  const etaTime = new Date(dispatchedAt).getTime() + MOCK_DELIVERY_MINUTES * 60 * 1000;
  const remainingMs = etaTime - Date.now();
  if (remainingMs <= 0) return "Arriving any moment";
  const mins = Math.ceil(remainingMs / 60000);
  return `~${mins} min${mins !== 1 ? "s" : ""} remaining`;
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState({ bloodGroup: "", units: 1 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [, forceTick] = useState(0); // used to refresh the countdown text periodically

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests/mine");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const poll = setInterval(fetchRequests, 15000); // check for blood bank updates every 15s
    const tick = setInterval(() => forceTick((n) => n + 1), 30000); // refresh countdown display
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/requests", form);
      setForm({ bloodGroup: "", units: 1 });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status) => {
    if (status === "Approved") return "text-green-600";
    if (status === "Declined") return "text-red-500";
    if (status === "Delivered") return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name || "Hospital"}</h1>
      <p className="text-gray-500 mb-8">Raise a blood request to nearby blood banks.</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type of blood</label>
          <select
            name="bloodGroup"
            required
            value={form.bloodGroup}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-600"
          >
            <option value="">Select</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Units needed</label>
          <input
            type="number"
            name="units"
            min="1"
            required
            value={form.units}
            onChange={handleChange}
            className="w-28 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-red-600 text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>

        {error && <span className="text-red-600 text-sm">{error}</span>}
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Your requests</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-500">No requests raised yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-700 font-medium">{r.bloodGroup}</span>
                  <span className="text-gray-500 ml-2">{r.units} unit(s)</span>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${statusColor(r.status)}`}>{r.status}</div>
                  {r.status === "Approved" && (
                    <div className="text-xs text-gray-400 mt-0.5">{getEta(r.dispatchedAt)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}