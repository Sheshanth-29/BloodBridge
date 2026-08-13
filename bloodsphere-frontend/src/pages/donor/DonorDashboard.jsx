import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

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

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome, {user?.name || "Donor"}
      </h1>
      <p className="text-gray-500 mb-8">
        Blood group: <span className="font-semibold text-red-600">{donor.bloodGroup}</span> · {donor.city}
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Donation availability</h2>
          <p className="text-sm text-gray-500 mt-1">
            {donor.status === "available"
              ? "You'll be notified when someone nearby needs your blood type."
              : "You won't receive donation requests right now."}
          </p>
          {!isEligible && (
            <p className="text-xs text-amber-600 mt-2">
              Next eligible to donate: {donor.nextEligibleDate}
            </p>
          )}
        </div>
        <button
          onClick={toggleStatus}
          disabled={!isEligible}
          className={`px-5 py-2 rounded-full font-medium text-sm transition ${
            donor.status === "available"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {donor.status === "available" ? "Available ●" : "Unavailable ○"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Your donation history</h2>
        {donor.donationHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No donations recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {donor.donationHistory.map((d) => (
              <div key={d.id} className="py-3 flex justify-between text-sm">
                <span className="text-gray-700">{d.bloodBank}</span>
                <span className="text-gray-500">{d.date}</span>
                <span className="text-gray-500">{d.units} unit(s)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}