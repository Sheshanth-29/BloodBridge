import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Droplet, Heart, Calendar, Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

// TODO: replace this mock data with a real API call once the backend is ready:
// const res = await api.get(`/donors/${user.id}`);
const MOCK_DONOR = {
  bloodGroup: "O+",
  city: "Erode",
  status: "available",
  lastDonationDate: "2026-05-12",
  nextEligibleDate: "2026-08-10",
  donationHistory: [
    { id: 1, bloodBank: "Red Cross Blood Bank", date: "2026-05-12", units: 1 },
    { id: 2, bloodBank: "City Blood Bank", date: "2026-02-01", units: 1 },
  ],
};

// ── iOS-style toggle switch (pure visual, clicks still call toggleStatus) ──
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`toggle-track border-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked
          ? "bg-green-500 border-green-500"
          : "bg-gray-200 border-gray-200"
      }`}
    >
      <span className={`toggle-thumb ${checked ? "on" : ""}`} />
    </button>
  );
}

// ── Status pill badge ─────────────────────────────────────────────────────
function StatusBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full animate-dot-pulse ${
          available ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donor, setDonor] = useState(MOCK_DONOR);

  const toggleStatus = () => {
    setDonor((prev) => ({
      ...prev,
      status: prev.status === "available" ? "unavailable" : "available",
    }));
  };

  const isEligible = new Date() >= new Date(donor.nextEligibleDate);
  const isAvailable = donor.status === "available";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50/50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Welcome header ── */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {user?.name || "Donor"}
            </h1>
            <StatusBadge available={isAvailable} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Droplet size={14} className="text-red-500 fill-red-500" />
              <span className="font-semibold text-red-600">{donor.bloodGroup}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-gray-400" />
              {donor.city}
            </span>
          </div>
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
              {!isEligible && (
                <div className="flex items-center gap-1.5 mt-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg w-fit">
                  <AlertCircle size={12} />
                  Next eligible: {donor.nextEligibleDate}
                </div>
              )}
            </div>

            {/* iOS-style toggle */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <ToggleSwitch
                checked={isAvailable}
                onChange={toggleStatus}
                disabled={!isEligible}
              />
              <span className="text-xs text-gray-400 font-medium">
                {isAvailable ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Donation history — timeline style ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={16} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">Your donation history</h2>
          </div>

          {donor.donationHistory.length === 0 ? (
            <div className="text-center py-8">
              <Droplet size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No donations recorded yet.</p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-red-300 to-rose-100" />

              <div className="space-y-6">
                {donor.donationHistory.map((d, i) => (
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
                            <span className="font-semibold text-gray-700 text-sm">{d.bloodBank}</span>
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(d.date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
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