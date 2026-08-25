import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Droplet, User, Building2, Search, CheckCircle2,
  PlusCircle, AlertTriangle, Package, Clock, XCircle, RefreshCw
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Stock stays mocked — real inventory sync needs actual blood bank partnerships (future scope)
const MOCK_STOCK = [
  { id: 1, bloodGroup: "A+", units: 12, expiryDate: "2026-09-10" },
  { id: 2, bloodGroup: "A-", units: 3, expiryDate: "2026-08-20" },
  { id: 3, bloodGroup: "B+", units: 8, expiryDate: "2026-09-25" },
  { id: 4, bloodGroup: "B-", units: 0, expiryDate: null },
  { id: 5, bloodGroup: "O+", units: 20, expiryDate: "2026-10-01" },
  { id: 6, bloodGroup: "O-", units: 2, expiryDate: "2026-08-15" },
  { id: 7, bloodGroup: "AB+", units: 5, expiryDate: "2026-09-05" },
  { id: 8, bloodGroup: "AB-", units: 1, expiryDate: "2026-08-18" },
];

// ── Skeleton row loader ───────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="py-3 flex items-center justify-between gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      </div>
      <div className="h-7 w-24 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ── Status pill badge ─────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    Pending:  { dot: "bg-amber-400",  bg: "bg-amber-50  text-amber-700  border-amber-100" },
    Approved: { dot: "bg-green-500",  bg: "bg-green-50  text-green-700  border-green-100" },
    Declined: { dot: "bg-gray-400",   bg: "bg-gray-50   text-gray-500   border-gray-100"  },
    Delivered:{ dot: "bg-blue-500",   bg: "bg-blue-50   text-blue-700   border-blue-100"  },
  };
  const s = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-dot-pulse ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Toast banner ─────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  const isError = !msg.startsWith("✓");
  return (
    <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4 border ${
      isError
        ? "bg-red-50 text-red-700 border-red-100"
        : "bg-green-50 text-green-700 border-green-100"
    }`}>
      {isError
        ? <XCircle size={15} className="shrink-0 mt-0.5" />
        : <CheckCircle2 size={15} className="shrink-0 mt-0.5" />}
      {msg.replace("✓ ", "")}
    </div>
  );
}

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const [stock, setStock] = useState(() => {
    const saved = localStorage.getItem("bb_mock_stock");
    return saved ? JSON.parse(saved) : MOCK_STOCK;
  });

  useEffect(() => {
    localStorage.setItem("bb_mock_stock", JSON.stringify(stock));
  }, [stock]);
  const [addForm, setAddForm] = useState({ bloodGroup: "", units: "", expiryDate: "" });

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [showAllRequests, setShowAllRequests] = useState(false);

  // Donor search + confirm
  const [searchGroup, setSearchGroup] = useState("");
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRequests(), searchDonors()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
    const poll = setInterval(fetchRequests, 15000);
    return () => clearInterval(poll);
  }, []);

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 7 && days >= 0;
  };

  const handleAddStock = (e) => {
    e.preventDefault();
    setStock((prev) =>
      prev.map((s) =>
        s.bloodGroup === addForm.bloodGroup
          ? { ...s, units: s.units + Number(addForm.units), expiryDate: addForm.expiryDate }
          : s
      )
    );
    setAddForm({ bloodGroup: "", units: "", expiryDate: "" });
  };

  const handleRequestAction = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/requests/${id}`, { status });
      fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const searchDonors = async () => {
    setLoadingDonors(true);
    setConfirmMsg("");
    try {
      const res = await api.get("/donations/available-donors", {
        params: searchGroup ? { bloodGroup: searchGroup } : {},
      });
      setDonors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonors(false);
    }
  };

  useEffect(() => {
    searchDonors(); // load all available donors on first visit
  }, []);

  const confirmDonation = async (donorId) => {
    setConfirmingId(donorId);
    setConfirmMsg("");
    try {
      const res = await api.post("/donations/confirm", { donorId, units: 1 });
      setConfirmMsg(`✓ Donation confirmed — reward coupon ${res.data.couponCode} emailed to donor.`);
      searchDonors(); // refresh — donor will drop off since they're now unavailable
    } catch (err) {
      setConfirmMsg(err.response?.data?.message || "Failed to confirm donation");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50/40 to-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8 animate-fade-in-up flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Welcome, {user?.name || "Blood Bank"}
            </h1>
            <p className="text-gray-500 text-sm">Manage your stock and respond to incoming requests.</p>
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

        {/* ── Stock grid ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-100">
          <div className="flex items-center gap-2 mb-5">
            <Package size={17} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Current stock</h2>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
            {stock.map((s) => {
              const empty = s.units === 0;
              const expiring = isExpiringSoon(s.expiryDate);
              const low = s.units > 0 && s.units <= 3;

              let cardCls = "rounded-xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ";
              if (empty)         cardCls += "border-gray-200 bg-gray-50";
              else if (expiring) cardCls += "border-amber-200 bg-amber-50 animate-tile-pulse";
              else if (low)      cardCls += "border-orange-200 bg-orange-50";
              else               cardCls += "border-red-100 bg-gradient-to-b from-red-50 to-rose-50";

              return (
                <div key={s.id} className={cardCls}>
                  <div className="mb-1">
                    <Droplet
                      size={14}
                      className={`mx-auto ${empty ? "text-gray-300" : expiring ? "text-amber-500" : "text-red-500 fill-red-400"}`}
                    />
                  </div>
                  <div className="font-bold text-gray-800 text-sm">{s.bloodGroup}</div>
                  <div className={`text-xl font-extrabold ${
                    empty ? "text-gray-300" : expiring ? "text-amber-600" : "text-red-600"
                  }`}>{s.units}</div>
                  <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">units</div>
                  {s.expiryDate && (
                    <div className={`text-[9px] mt-1 leading-tight ${expiring ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
                      {expiring && <AlertTriangle size={9} className="inline mr-0.5" />}
                      {s.expiryDate}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add stock form */}
          <form onSubmit={handleAddStock} className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Blood group</label>
              <select
                required
                value={addForm.bloodGroup}
                onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Units to add</label>
              <input
                type="number"
                min="1"
                required
                value={addForm.units}
                onChange={(e) => setAddForm({ ...addForm, units: e.target.value })}
                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Expiry date</label>
              <input
                type="date"
                required
                value={addForm.expiryDate}
                onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-500 hover:scale-105 transition-all duration-200 shadow-md shadow-red-200"
            >
              <PlusCircle size={15} /> Add stock
            </button>
          </form>
        </div>

        {/* ── Available donors ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-2 mb-5">
            <User size={17} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Available donors</h2>
          </div>

          <div className="flex gap-3 mb-5">
            <select
              value={searchGroup}
              onChange={(e) => setSearchGroup(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            >
              <option value="">All blood groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            <button
              onClick={searchDonors}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:scale-105 transition-all duration-200"
            >
              <Search size={14} /> Search
            </button>
          </div>

          <Toast msg={confirmMsg} />

          {loadingDonors ? (
            <div className="divide-y divide-gray-50">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-8">
              <User size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No available donors match this search.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {donors.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <User size={15} className="text-red-500" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">{d.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded">{d.bloodGroup}</span>
                        <span className="text-gray-400 text-xs">{d.city}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmDonation(d.id)}
                    disabled={confirmingId === d.id}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-500 hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-red-200"
                  >
                    {confirmingId === d.id ? (
                      <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Confirming...</>
                    ) : (
                      <><CheckCircle2 size={13} /> Confirm Donation</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Incoming requests ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={17} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Incoming requests</h2>
          </div>

          {loadingRequests ? (
            <div className="divide-y divide-gray-50">
              {[1, 2].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Building2 size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No requests right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(showAllRequests ? requests : requests.slice(0, 5)).map((r) => (
                <div key={r.id} className="py-4 flex items-start justify-between gap-3 text-sm">
                  <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-700">{r.requesterName}</span>
                      {/* If a hospital submitted on behalf of a patient, show both */}
                      {r.hospitalName && r.hospitalName !== r.requesterName && (
                        <span className="text-[10px] text-gray-400 italic">
                          via {r.hospitalName}
                        </span>
                      )}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                        {r.requesterType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded">{r.bloodGroup}</span>
                      <span className="text-gray-500 text-xs">{r.units} unit(s)</span>
                    </div>
                  </div>
                  {r.status === "Pending" ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRequestAction(r.id, "Approved")}
                        disabled={actingId === r.id}
                        className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-green-200 hover:scale-105 transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(r.id, "Declined")}
                        disabled={actingId === r.id}
                        className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-gray-200 hover:scale-105 transition-all disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0">
                      {r.status === "Delivered"
                        ? <StatusPill status="Delivered" />
                        : <StatusPill status={r.status} />}
                    </div>
                  )}
                </div>
              ))}

              {/* View more / Show less */}
              {requests.length > 5 && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => setShowAllRequests((prev) => !prev)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 rounded-xl px-5 py-2 transition-all duration-200"
                  >
                    {showAllRequests
                      ? `Show less ▲`
                      : `View more (${requests.length - 5} hidden) ▼`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}