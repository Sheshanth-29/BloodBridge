import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  ShieldCheck, Users, Building2, FlaskConical, Droplet,
  Package, Heart, Clock, Search, Trash2, CheckCircle2,
  AlertTriangle, RefreshCw, Filter, Award, ChevronRight,
  TrendingUp, Activity, Check, X, ShieldAlert, Sparkles
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Active Tab
  const [tab, setTab] = useState("overview"); // "overview" | "users" | "requests" | "donations" | "stocks"

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [stocks, setStocks] = useState([]);

  // Filter & Search states
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [requestSearch, setRequestSearch] = useState("");

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // ── Fetch All Admin Data ──────────────────────────────────────────────────
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setActionMsg("");
    setActionError("");
    try {
      const [statsRes, usersRes, reqsRes, donRes, stockRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users", { params: { role: userRoleFilter, search: userSearch } }),
        api.get("/admin/requests", { params: { status: requestStatusFilter, search: requestSearch } }),
        api.get("/admin/donations"),
        api.get("/admin/stocks"),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRequests(reqsRes.data);
      setDonations(donRes.data);
      setStocks(stockRes.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setActionError(err.response?.data?.message || "Failed to load administrative data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userRoleFilter, userSearch, requestStatusFilter, requestSearch]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(true);
    setRefreshing(false);
  };

  // ── Delete User Handler ───────────────────────────────────────────────────
  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email})?`)) {
      return;
    }

    setDeletingId(targetUser.id);
    setActionMsg("");
    setActionError("");
    try {
      const res = await api.delete(`/admin/users/${targetUser.id}`);
      setActionMsg(res.data.message || `User ${targetUser.name} deleted successfully`);
      await fetchAllData(true);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* ── Top Chief Command Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-[60px] z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-900/30">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Chief Administrator Center</h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete platform oversight, user management & system telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-red-400" : ""} />
              {refreshing ? "Syncing…" : "Live Sync"}
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-3">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: `Users (${users.length})`, icon: Users },
            { id: "requests", label: `Requests (${requests.length})`, icon: Clock },
            { id: "donations", label: `Donations (${donations.length})`, icon: Heart },
            { id: "stocks", label: "Stock Inventory", icon: Package },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tab === id
                  ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Dashboard Body ── */}
      <div className="max-w-7xl mx-auto px-6 pt-8">

        {/* Alert Feedback Messages */}
        {actionMsg && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-sm px-4 py-3 rounded-2xl animate-fade-in-up">
            <CheckCircle2 size={16} className="shrink-0" />
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div className="mb-6 flex items-center gap-2 bg-red-950/80 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-2xl animate-fade-in-up">
            <AlertTriangle size={16} className="shrink-0" />
            {actionError}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & TELEMETRY
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-8 animate-fade-in-up">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Users", val: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/40" },
                { label: "Donors", val: stats?.totalDonors ?? "—", icon: Droplet, color: "text-red-400", bg: "bg-red-950/30 border-red-900/40" },
                { label: "Hospitals", val: stats?.totalHospitals ?? "—", icon: Building2, color: "text-cyan-400", bg: "bg-cyan-950/30 border-cyan-900/40" },
                { label: "Blood Banks", val: stats?.totalBloodBanks ?? "—", icon: FlaskConical, color: "text-purple-400", bg: "bg-purple-950/30 border-purple-900/40" },
                { label: "Stock Units", val: stats?.totalUnitsInStock ?? "—", icon: Package, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40" },
                { label: "Donations Logged", val: stats?.totalDonations ?? "—", icon: Award, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
              ].map(({ label, val, icon: Icon, color, bg }) => (
                <div key={label} className={`border rounded-2xl p-5 ${bg} backdrop-blur-sm shadow-sm transition hover:border-slate-700`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    <Icon size={16} className={color} />
                  </div>
                  <div className={`text-2xl font-extrabold ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            {/* Request Telemetry & System Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Request Status Breakdown */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-red-400" />
                    <h2 className="font-bold text-white text-base">Blood Requests Telemetry</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{stats?.requests?.total ?? 0} Total</span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Pending Review", count: stats?.requests?.pending ?? 0, color: "bg-amber-500", text: "text-amber-400" },
                    { label: "Approved (Lent)", count: stats?.requests?.approved ?? 0, color: "bg-blue-500", text: "text-blue-400" },
                    { label: "Delivered & Fulfilled", count: stats?.requests?.delivered ?? 0, color: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "Declined", count: stats?.requests?.declined ?? 0, color: "bg-red-500", text: "text-red-400" },
                  ].map(({ label, count, color, text }) => {
                    const total = stats?.requests?.total || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-300">{label}</span>
                          <span className={text}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & System Info */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} className="text-amber-400" />
                    <h2 className="font-bold text-white text-base">Administrator Guard Controls</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    As Chief Administrator, you have unrestricted access to manage all registered donors, hospitals, and blood banks. You can inspect live logs, delete compromised accounts, monitor blood requests, and review inventory counts in real time.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setTab("users")}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    <Users size={14} /> Manage Users
                  </button>
                  <button
                    onClick={() => setTab("stocks")}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    <Package size={14} /> View All Stocks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: USERS MANAGEMENT
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            {/* Header + Search + Role Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-red-400" />
                <h2 className="font-bold text-white text-base">User Directory & Management</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, city..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 w-52 sm:w-64"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Roles</option>
                  <option value="donor">Donors</option>
                  <option value="hospital">Hospitals</option>
                  <option value="bloodbank">Blood Banks</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No users found matching your search.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {users.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition">
                          {/* User Avatar + Name + Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                u.role === "donor" ? "bg-red-950 text-red-400 border border-red-800/40"
                                : u.role === "hospital" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40"
                                : u.role === "bloodbank" ? "bg-purple-950 text-purple-400 border border-purple-800/40"
                                : "bg-amber-950 text-amber-400 border border-amber-800/40"
                              }`}>
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">{u.name}</div>
                                <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              u.role === "donor" ? "bg-red-950/80 text-red-300 border-red-800"
                              : u.role === "hospital" ? "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                              : u.role === "bloodbank" ? "bg-purple-950/80 text-purple-300 border-purple-800"
                              : "bg-amber-950/80 text-amber-300 border-amber-800"
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                            {u.phone || "—"}
                          </td>

                          {/* Specifics (Blood Group or Org Name) */}
                          <td className="py-3 px-4">
                            {u.role === "donor" && u.bloodGroup && (
                              <span className="bg-red-900/40 text-red-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                {u.bloodGroup} {u.city ? `· ${u.city}` : ""}
                              </span>
                            )}
                            {(u.role === "hospital" || u.role === "bloodbank") && (
                              <span className="text-slate-300">
                                {u.orgName || u.address || "—"}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === "available" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                              : "bg-slate-800 text-slate-400"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === "available" ? "bg-emerald-400" : "bg-slate-500"}`} />
                              {u.status}
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={deletingId === u.id}
                                title="Delete user"
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition disabled:opacity-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: BLOOD REQUESTS MONITOR
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "requests" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-red-400" />
                <h2 className="font-bold text-white text-base">Platform Blood Requests Monitor</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search requester, hospital..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 w-52 sm:w-64"
                  />
                </div>

                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No blood requests on record.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Requester</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Units</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Requested Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{r.requesterName}</div>
                          {r.hospitalName && r.hospitalName !== r.requesterName && (
                            <div className="text-[10px] text-slate-400 italic">via {r.hospitalName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-slate-400">{r.requesterType}</td>
                        <td className="py-3 px-4">
                          <span className="bg-red-900/40 text-red-300 font-extrabold px-2 py-0.5 rounded text-[11px]">
                            {r.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{r.units} unit{r.units !== 1 ? "s" : ""}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            r.status === "Approved" ? "bg-blue-950 text-blue-300 border-blue-800"
                            : r.status === "Delivered" ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : r.status === "Declined" ? "bg-red-950 text-red-300 border-red-800"
                            : "bg-amber-950 text-amber-300 border-amber-800"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          <div>{r.contactEmail || "—"}</div>
                          <div className="font-mono">{r.contactPhone || ""}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: DONATIONS & REWARDS LEDGER
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "donations" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <Heart size={18} className="text-red-400" />
              <h2 className="font-bold text-white text-base">Confirmed Donations & Coupon Rewards Ledger</h2>
            </div>

            {donations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No donations recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Blood Bank</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Units</th>
                      <th className="py-3 px-4">Reward Coupon</th>
                      <th className="py-3 px-4">Donation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{d.donor?.name || `Donor #${d.donorId}`}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.donor?.email || ""}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{d.bloodBankName}</td>
                        <td className="py-3 px-4">
                          <span className="bg-red-900/40 text-red-300 font-extrabold px-2 py-0.5 rounded text-[11px]">
                            {d.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{d.units} unit{d.units !== 1 ? "s" : ""}</td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                            🎟 {d.couponCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(d.donationDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: STOCK & INVENTORY OVERSIGHT
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "stocks" && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <Package size={18} className="text-red-400" />
              <h2 className="font-bold text-white text-base">Network-wide Blood Inventory Oversight</h2>
            </div>

            {stocks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No blood stock entries found across blood banks.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Blood Bank Facility</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Available Units</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Inventory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {stocks.map((s) => {
                      const isLow = s.units === 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{s.bloodBank?.orgName || s.bloodBank?.name || `Bank #${s.bloodBankId}`}</div>
                            <div className="text-[10px] text-slate-400">{s.bloodBank?.city || ""}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-red-900/40 text-red-300 font-extrabold px-2.5 py-0.5 rounded text-xs">
                              {s.bloodGroup}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-sm text-white">
                            {s.units} unit{s.units !== 1 ? "s" : ""}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                            {s.expiryDate || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {isLow ? (
                              <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle size={10} /> Insufficient stock
                              </span>
                            ) : (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Check size={10} /> In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
