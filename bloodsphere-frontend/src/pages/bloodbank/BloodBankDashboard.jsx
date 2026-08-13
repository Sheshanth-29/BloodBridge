import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

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

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const [stock, setStock] = useState(MOCK_STOCK);
  const [addForm, setAddForm] = useState({ bloodGroup: "", units: "", expiryDate: "" });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null); // tracks which request is mid-approve/decline

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const poll = setInterval(fetchRequests, 15000); // pick up new hospital/patient requests automatically
    return () => clearInterval(poll);
  }, []);

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 7 && days >= 0;
  };

  const handleAddStock = (e) => {
    e.preventDefault();
    // TODO: await api.post(`/bloodbank/${user.id}/stock`, addForm) once stock backend exists
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
      fetchRequests(); // pull the fresh status right after
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name || "Blood Bank"}</h1>
      <p className="text-gray-500 mb-8">Manage your stock and respond to incoming requests.</p>

      {/* Stock table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Current stock</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {stock.map((s) => (
            <div
              key={s.id}
              className={`rounded-lg border p-3 text-center ${
                s.units === 0
                  ? "border-gray-200 bg-gray-50"
                  : isExpiringSoon(s.expiryDate)
                  ? "border-amber-300 bg-amber-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="font-bold text-gray-800">{s.bloodGroup}</div>
              <div className="text-lg font-semibold text-red-600">{s.units}</div>
              <div className="text-[10px] text-gray-400">units</div>
              {s.expiryDate && (
                <div className={`text-[10px] mt-1 ${isExpiringSoon(s.expiryDate) ? "text-amber-600 font-medium" : "text-gray-400"}`}>
                  exp {s.expiryDate}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddStock} className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Blood group</label>
            <select
              required
              value={addForm.bloodGroup}
              onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Units to add</label>
            <input
              type="number"
              min="1"
              required
              value={addForm.units}
              onChange={(e) => setAddForm({ ...addForm, units: e.target.value })}
              className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiry date</label>
            <input
              type="date"
              required
              value={addForm.expiryDate}
              onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-red-700">
            Add stock
          </button>
        </form>
      </div>

      {/* Incoming requests — now real */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Incoming requests</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-500">No requests right now.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-700">{r.requesterName}</span>
                  <span className="text-gray-400 ml-2 capitalize">({r.requesterType})</span>
                  <div className="text-gray-500">{r.bloodGroup} · {r.units} unit(s)</div>
                </div>
                {r.status === "Pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(r.id, "Approved")}
                      disabled={actingId === r.id}
                      className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestAction(r.id, "Declined")}
                      disabled={actingId === r.id}
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-medium ${r.status === "Approved" ? "text-green-600" : "text-gray-400"}`}>
                    {r.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 