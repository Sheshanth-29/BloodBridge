import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Droplet, Heart, Calendar, Building2, MapPin,
  CheckCircle2, AlertCircle, Loader2, ServerCrash, RefreshCw,
  BellRing, Check, X, Sparkles,
} from "lucide-react";

// ── iOS-style toggle switch ────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`toggle-track border-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:cursor-not-allowed ${checked
        ? "bg-green-500 border-green-500"
        : "bg-gray-200 border-gray-200"
        }`}
    >
      <span className={`toggle-thumb ${checked ? "on" : ""}`} />
    </button>
  );
}

// ── Status pill badge ──────────────────────────────────────────────────────
function StatusBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full animate-dot-pulse ${available ? "bg-green-500" : "bg-gray-400"
          }`}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export default function DonorDashboard() {
  const { user, updateUser } = useAuth();

  // ── Local availability state (starts from the user record) ──
  const [isAvailable, setIsAvailable] = useState(
    user?.status === "available"
  );
  const [toggling, setToggling] = useState(false); // prevents double-tap
  const [toggleError, setToggleError] = useState("");

  // ── Active incoming alerts from Blood Banks ──
  const [alerts, setAlerts] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  // ── Real-time donation history ──
  const [donations, setDonations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get("/donors/alerts");
      setAlerts(res.data);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchDonations = useCallback(async (silent = false) => {
    if (!silent) setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await api.get("/donations/mine");
      setDonations(res.data);
    } catch (err) {
      setHistoryError(
        err?.response?.data?.message || "Could not load donation history."
      );
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch donation history, alerts, and profile status
      const [, profileRes] = await Promise.all([
        fetchDonations(true),
        api.get("/donors/me"),
        fetchAlerts(),
      ]);
      const realStatus = profileRes.data.status === "available";
      setIsAvailable(realStatus);
      updateUser({ status: profileRes.data.status });
    } catch {
      // silently ignore
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchAlerts();
    // Poll alerts every 2.5s for real-time notification
    const alertPoll = setInterval(fetchAlerts, 2500);
    return () => clearInterval(alertPoll);
  }, [fetchDonations, fetchAlerts]);

  // Eligibility is driven from the real user record in AuthContext
  const nextEligibleDate = user?.nextEligibleDate
    ? new Date(user.nextEligibleDate)
    : null;
  const isEligible = !nextEligibleDate || new Date() >= nextEligibleDate;

  const toggleStatus = async () => {
    if (toggling) return;
    const newStatus = isAvailable ? "unavailable" : "available";
    setIsAvailable((prev) => !prev);
    setToggleError("");
    setToggling(true);
    try {
      const res = await api.patch("/donors/me/status", { status: newStatus });
      updateUser({ status: res.data.status });
      setIsAvailable(res.data.status === "available");
    } catch (err) {
      setIsAvailable((prev) => !prev);
      setToggleError(
        err?.response?.data?.message || "Failed to update availability."
      );
    } finally {
      setToggling(false);
    }
  };

  const handleAlertResponse = async (alertId, response) => {
    setRespondingId(alertId);
    try {
      await api.patch(`/donors/alerts/${alertId}/respond`, { response });
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to respond to alert:", err);
    } finally {
      setRespondingId(null);
    }
  };

  const pendingAlert = alerts.find((a) => a.status === "pending");
  const acceptedAlert = alerts.find((a) => a.status === "accepted");

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50/50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Active Urgent Blood Request Alert Banner (Pending) ── */}
        {pendingAlert && (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-6 mb-6 shadow-xl shadow-red-300 border border-red-400/30 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                <BellRing size={24} className="text-white animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="bg-white/25 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    🚨 Urgent Blood Needed
                  </span>
                  <span className="bg-red-900/40 text-red-100 text-xs font-bold px-2 py-0.5 rounded-md">
                    {pendingAlert.bloodGroup}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mb-1">
                  {pendingAlert.bloodBankName} needs your blood right now!
                </h3>
                <p className="text-red-100 text-sm mb-4 leading-relaxed">
                  {pendingAlert.message || `An urgent patient request at ${pendingAlert.bloodBankName} matches your blood type. Can you donate today?`}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleAlertResponse(pendingAlert.id, "accepted")}
                    disabled={respondingId === pendingAlert.id}
                    className="flex items-center gap-2 bg-white text-red-700 hover:bg-red-50 font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-md hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    <Check size={16} className="stroke-[3]" />
                    {respondingId === pendingAlert.id ? "Accepting..." : "Accept & Donate"}
                  </button>
                  <button
                    onClick={() => handleAlertResponse(pendingAlert.id, "declined")}
                    disabled={respondingId === pendingAlert.id}
                    className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-60"
                  >
                    <X size={15} />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Accepted Alert Notice Banner ── */}
        {!pendingAlert && acceptedAlert && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 shadow-sm flex items-start justify-between gap-3 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-emerald-900 text-sm">You Accepted the Donation Request!</h4>
                  <span className="inline-flex items-center gap-1 bg-emerald-200/60 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    <Sparkles size={10} /> Ready to Donate
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Thank you! Please visit <strong className="font-semibold">{acceptedAlert.bloodBankName}</strong>. Once you donate, the blood bank will click <em>Confirm Donation</em>, and your reward coupon code will be emailed to you!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Welcome header ── */}
        <div className="mb-8 animate-fade-in-up flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {user?.name || "Donor"}
              </h1>
              <StatusBadge available={isAvailable} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
              {user?.bloodGroup && (
                <>
                  <span className="flex items-center gap-1">
                    <Droplet size={14} className="text-red-500 fill-red-500" />
                    <span className="font-semibold text-red-600">{user.bloodGroup}</span>
                  </span>
                  <span className="text-gray-300">·</span>
                </>
              )}
              {user?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-gray-400" />
                  {user.city}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loadingHistory}
            title="Refresh donation history"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 bg-white rounded-xl px-3 py-2 shadow-sm transition-all duration-200 disabled:opacity-50 mt-1 shrink-0"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Availability card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in-up delay-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Heart size={16} className={isAvailable ? "text-red-500" : "text-gray-400"} />
                <h2 className="font-semibold text-gray-800">Donation availability</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isAvailable
                  ? "You'll be notified when someone nearby needs your blood type."
                  : "You won't receive donation requests right now."}
              </p>
              {!isEligible && nextEligibleDate && (
                <div className="flex items-center gap-1.5 mt-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg w-fit">
                  <AlertCircle size={12} />
                  Next eligible: {nextEligibleDate.toLocaleDateString("en-IN", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </div>
              )}
            </div>

            {/* iOS-style toggle */}
            <div
              className="flex flex-col items-center gap-2 pt-1 cursor-pointer select-none"
              onClick={!isEligible || toggling ? undefined : toggleStatus}
            >
              <ToggleSwitch
                checked={isAvailable}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleStatus();
                }}
                disabled={!isEligible || toggling}
              />
              <span className={`text-xs font-semibold tracking-wider transition-colors ${
                isAvailable ? "text-green-600" : "text-gray-400"
              }`}>
                {toggling ? "…" : isAvailable ? "ON" : "OFF"}
              </span>
            </div>
          </div>
          {toggleError && (
            <div className="flex items-center gap-1.5 mt-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg">
              <AlertCircle size={12} />
              {toggleError}
            </div>
          )}
        </div>

        {/* ── Donation history — real-time timeline ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Your donation history</h2>
            {!loadingHistory && donations.length > 0 && (
              <span className="ml-auto text-xs bg-red-50 text-red-500 font-semibold px-2.5 py-0.5 rounded-full border border-red-100">
                {donations.length} donation{donations.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Loading state */}
          {loadingHistory && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
              <Loader2 size={28} className="animate-spin text-red-400" />
              <p className="text-sm">Fetching your donation history…</p>
            </div>
          )}

          {/* Error state */}
          {!loadingHistory && historyError && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
              <ServerCrash size={28} className="text-gray-300" />
              <p className="text-sm text-red-400">{historyError}</p>
            </div>
          )}

          {/* Empty state — fresh donor */}
          {!loadingHistory && !historyError && donations.length === 0 && (
            <div className="text-center py-10">
              <Droplet size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No donations recorded yet.</p>
              <p className="text-xs text-gray-300 mt-1">
                Your history will appear here after your first confirmed donation.
              </p>
            </div>
          )}

          {/* Real donation timeline */}
          {!loadingHistory && !historyError && donations.length > 0 && (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-red-300 to-rose-100" />

              <div className="space-y-6">
                {donations.map((d) => (
                  <div key={d.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-white border-2 border-red-400 flex items-center justify-center">
                      <CheckCircle2 size={10} className="text-red-500" />
                    </div>

                    <div className="bg-red-50/50 rounded-xl px-4 py-3 border border-red-100/70 hover:border-red-200 hover:bg-red-50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Building2 size={13} className="text-red-400" />
                            <span className="font-semibold text-gray-700 text-sm">
                              {d.bloodBankName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(d.donationDate).toLocaleDateString("en-IN", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </span>
                          {d.couponCode && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              🎟 {d.couponCode}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                          {d.units} unit{d.units !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}