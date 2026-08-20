import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Droplet, Send, ClipboardList, CheckCircle2,
  Truck, PackageCheck, AlertCircle, Clock, RefreshCw
} from "lucide-react";

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

// ── Step progress tracker ─────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "Requested",  icon: ClipboardList, label: "Requested"  },
  { key: "Approved",   icon: CheckCircle2,  label: "Approved"   },
  { key: "Dispatched", icon: Truck,         label: "Dispatched" },
  { key: "Delivered",  icon: PackageCheck,  label: "Delivered"  },
];

const STATUS_ORDER = { Requested: 0, Approved: 1, Declined: 1, Dispatched: 2, Delivered: 3 };

function RequestTracker({ status }) {
  const currentIdx = STATUS_ORDER[status] ?? 0;
  const isDeclined = status === "Declined";

  return (
    <div className="flex items-center gap-0 mt-3 w-full max-w-xs">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIdx || (status === "Delivered" && i <= 3);
        const active = i === currentIdx && !isDeclined;
        const future = i > currentIdx;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isDeclined && i >= 1 ? "bg-gray-100 text-gray-300"
                  : done   ? "bg-green-500 text-white"
                  : active ? "bg-red-600 text-white ring-2 ring-red-200"
                  : "bg-gray-100 text-gray-300"
                }`}
              >
                <Icon size={13} />
              </div>
              <span className={`text-[9px] mt-1 font-medium text-center leading-tight ${
                active ? "text-red-600" : done ? "text-green-600" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
            {/* Connector line (not after last) */}
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-3.5 transition-all duration-500 ${
                i < currentIdx && !isDeclined ? "bg-green-400" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="py-4 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-100 rounded-full w-24" />
          <div className="h-3 bg-gray-100 rounded-full w-40" />
          <div className="flex gap-2 pt-1">
            {[1,2,3,4].map(i => <div key={i} className="h-7 w-14 bg-gray-100 rounded-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState({ bloodGroup: "", units: 1 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [, forceTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

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
    const poll = setInterval(fetchRequests, 15000);
    const tick = setInterval(() => forceTick((n) => n + 1), 30000);
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

  const markArrived = async (id) => {
    setActingId(id);
    try {
      await api.patch(`/requests/${id}`, { status: "Delivered" });
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const statusColor = (status) => {
    if (status === "Approved")   return "text-green-600";
    if (status === "Declined")   return "text-red-500";
    if (status === "Delivered")  return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50/40 to-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8 animate-fade-in-up flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Welcome, {user?.name || "Hospital"}
            </h1>
            <p className="text-gray-500 text-sm">Raise a blood request to nearby blood banks.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh dashboard data"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 bg-white rounded-xl px-3 py-2 shadow-sm transition-all duration-200 disabled:opacity-50 mt-1"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Request form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-100">
          <div className="flex items-center gap-2 mb-5">
            <Send size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">New blood request</h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Type of blood</label>
              <div className="relative">
                <Droplet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  name="bloodGroup"
                  required
                  value={form.bloodGroup}
                  onChange={handleChange}
                  className="pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-700 text-sm bg-white appearance-none"
                >
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Units needed</label>
              <input
                type="number"
                name="units"
                min="1"
                required
                value={form.units}
                onChange={handleChange}
                className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-500 hover:scale-105 transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><Send size={14} /> Submit Request</>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* ── Requests list ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={17} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Your requests</h2>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No requests raised yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((r) => (
                <div key={r.id} className="py-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-600 text-sm font-extrabold px-2.5 py-0.5 rounded-lg">{r.bloodGroup}</span>
                      <span className="text-gray-500 text-sm">{r.units} unit{r.units !== 1 ? "s" : ""}</span>
                    </div>
                    <span className={`text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                  </div>

                  {/* Progress tracker */}
                  {r.status !== "Declined" && <RequestTracker status={r.status} />}
                  {r.status === "Declined" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                      <AlertCircle size={12} /> Request was declined by the blood bank.
                    </div>
                  )}

                  {/* ETA + mark arrived */}
                  {r.status === "Approved" && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {getEta(r.dispatchedAt) && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                          <Truck size={11} />
                          {getEta(r.dispatchedAt)}
                        </span>
                      )}
                      <button
                        onClick={() => markArrived(r.id)}
                        disabled={actingId === r.id}
                        className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-200 hover:scale-105 transition-all disabled:opacity-50"
                      >
                        {actingId === r.id ? (
                          <><span className="w-3 h-3 border border-blue-400 border-t-blue-700 rounded-full animate-spin" /> Updating...</>
                        ) : (
                          <><PackageCheck size={13} /> Mark as Arrived</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}