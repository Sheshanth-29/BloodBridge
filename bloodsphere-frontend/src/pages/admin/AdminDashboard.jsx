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
    <div className="min-h-screen bg-gradient-to-br from-red-50/40 via-rose-50/30 to-white text-gray-800 pb-16">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="border-b border-red-100/80 bg-white/80 backdrop-blur-md sticky top-[60px] z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-md shadow-red-200">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chief Administrator Center</h1>
                <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-gray-500">Platform oversight, user management & system telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin text-red-600" : "text-gray-500"} />
              {refreshing ? "Syncing…" : "Live Sync"}
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 pt-3">
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
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "bg-white text-gray-600 border border-gray-200/80 hover:bg-red-50/60 hover:text-red-600"
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
          <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl shadow-sm animate-fade-in-up">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            {actionMsg}
          </div>
        )}
        {actionError && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl shadow-sm animate-fade-in-up">
            <AlertTriangle size={16} className="shrink-0 text-red-600" />
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
                { label: "Total Users", val: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-600", bg: "bg-gradient-to-br from-blue-50 to-white border-blue-100" },
                { label: "Donors", val: stats?.totalDonors ?? "—", icon: Droplet, color: "text-red-600", bg: "bg-gradient-to-br from-red-50 to-white border-red-100" },
                { label: "Hospitals", val: stats?.totalHospitals ?? "—", icon: Building2, color: "text-cyan-600", bg: "bg-gradient-to-br from-cyan-50 to-white border-cyan-100" },
                { label: "Blood Banks", val: stats?.totalBloodBanks ?? "—", icon: FlaskConical, color: "text-purple-600", bg: "bg-gradient-to-br from-purple-50 to-white border-purple-100" },
                { label: "Stock Units", val: stats?.totalUnitsInStock ?? "—", icon: Package, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-white border-emerald-100" },
                { label: "Donations Logged", val: stats?.totalDonations ?? "—", icon: Award, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-white border-amber-100" },
              ].map(({ label, val, icon: Icon, color, bg }) => (
                <div key={label} className={`border rounded-2xl p-5 ${bg} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
                    <div className="p-1.5 bg-white rounded-lg shadow-xs">
                      <Icon size={15} className={color} />
                    </div>
                  </div>
                  <div className={`text-2xl font-extrabold ${color}`}>{val}</div>
                </div>
              ))}
            </div>

            {/* Request Telemetry & System Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Request Status Breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock size={17} className="text-red-600" />
                    <h2 className="font-bold text-gray-800 text-base">Blood Requests Telemetry</h2>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">
                    {stats?.requests?.total ?? 0} Total Requests
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Pending Review", count: stats?.requests?.pending ?? 0, bar: "bg-amber-500", text: "text-amber-600" },
                    { label: "Approved (Lent)", count: stats?.requests?.approved ?? 0, bar: "bg-blue-500", text: "text-blue-600" },
                    { label: "Delivered & Fulfilled", count: stats?.requests?.delivered ?? 0, bar: "bg-emerald-500", text: "text-emerald-600" },
                    { label: "Declined", count: stats?.requests?.declined ?? 0, bar: "bg-red-500", text: "text-red-600" },
                  ].map(({ label, count, bar, text }) => {
                    const total = stats?.requests?.total || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-gray-700">{label}</span>
                          <span className={`${text} font-bold`}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & System Info */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <ShieldAlert size={17} className="text-red-600" />
                    <h2 className="font-bold text-gray-800 text-base">Administrator Guard Controls</h2>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    As Chief Administrator, you have unrestricted access to manage all registered donors, hospitals, and blood banks. You can inspect live logs, delete compromised accounts, monitor emergency requests, and review real-time stock levels across all facilities.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setTab("users")}
                    className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold py-2.5 rounded-xl border border-gray-200 transition"
                  >
                    <Users size={14} /> Manage Users
                  </button>
                  <button
                    onClick={() => setTab("stocks")}
                    className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold py-2.5 rounded-xl border border-gray-200 transition"
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            {/* Header + Search + Role Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-red-600" />
                <h2 className="font-bold text-gray-800 text-base">User Directory & Management</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, city..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 w-52 sm:w-64"
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <div className="p-8 text-center text-gray-400 text-sm">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No users found matching your search.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
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
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {users.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/70 transition">
                          {/* User Avatar + Name + Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                u.role === "donor" ? "bg-red-50 text-red-600 border border-red-100"
                                : u.role === "hospital" ? "bg-cyan-50 text-cyan-600 border border-cyan-100"
                                : u.role === "bloodbank" ? "bg-purple-50 text-purple-600 border border-purple-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}>
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{u.name}</div>
                                <div className="text-gray-400 text-[11px] font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              u.role === "donor" ? "bg-red-50 text-red-600 border-red-200"
                              : u.role === "hospital" ? "bg-cyan-50 text-cyan-600 border-cyan-200"
                              : u.role === "bloodbank" ? "bg-purple-50 text-purple-600 border-purple-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                            {u.phone || "—"}
                          </td>

                          {/* Details */}
                          <td className="py-3 px-4">
                            {u.role === "donor" && u.bloodGroup && (
                              <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[11px]">
                                {u.bloodGroup} {u.city ? `· ${u.city}` : ""}
                              </span>
                            )}
                            {(u.role === "hospital" || u.role === "bloodbank") && (
                              <span className="text-gray-600">
                                {u.orgName || u.address || "—"}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.status === "available" ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-gray-100 text-gray-500"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.status === "available" ? "bg-emerald-500" : "bg-gray-400"}`} />
                              {u.status}
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3 px-4 text-gray-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={deletingId === u.id}
                                title="Delete user"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-red-600" />
                <h2 className="font-bold text-gray-800 text-base">Platform Blood Requests Monitor</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search requester, hospital..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 w-52 sm:w-64"
                  />
                </div>

                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <div className="p-8 text-center text-gray-400 text-sm">No blood requests on record.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
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
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{r.requesterName}</div>
                          {r.hospitalName && r.hospitalName !== r.requesterName && (
                            <div className="text-[10px] text-gray-400 italic">via {r.hospitalName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold text-gray-500">{r.requesterType}</td>
                        <td className="py-3 px-4">
                          <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded text-[11px]">
                            {r.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{r.units} unit{r.units !== 1 ? "s" : ""}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            r.status === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : r.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "Declined" ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          <div>{r.contactEmail || "—"}</div>
                          <div className="font-mono text-gray-400">{r.contactPhone || ""}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <Heart size={18} className="text-red-600" />
              <h2 className="font-bold text-gray-800 text-base">Confirmed Donations & Coupon Rewards Ledger</h2>
            </div>

            {donations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No donations recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Blood Bank</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Units</th>
                      <th className="py-3 px-4">Reward Coupon</th>
                      <th className="py-3 px-4">Donation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{d.donor?.name || `Donor #${d.donorId}`}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{d.donor?.email || ""}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{d.bloodBankName}</td>
                        <td className="py-3 px-4">
                          <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded text-[11px]">
                            {d.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{d.units} unit{d.units !== 1 ? "s" : ""}</td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold px-2.5 py-0.5 rounded text-[11px]">
                            🎟 {d.couponCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <Package size={18} className="text-red-600" />
              <h2 className="font-bold text-gray-800 text-base">Network-wide Blood Inventory Oversight</h2>
            </div>

            {stocks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No blood stock entries found across blood banks.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Blood Bank Facility</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Available Units</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Inventory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {stocks.map((s) => {
                      const isLow = s.units === 0;
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{s.bloodBank?.orgName || s.bloodBank?.name || `Bank #${s.bloodBankId}`}</div>
                            <div className="text-[10px] text-gray-400">{s.bloodBank?.city || ""}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded text-xs">
                              {s.bloodGroup}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-sm text-gray-900">
                            {s.units} unit{s.units !== 1 ? "s" : ""}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-[11px] font-mono">
                            {s.expiryDate || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {isLow ? (
                              <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle size={10} /> Insufficient stock
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
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
