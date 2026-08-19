import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../../api/axios";
import DeliveryTracker from "../../components/common/DeliveryTracker";

// ─── Mock coordinates ─────────────────────────────────────────────────────────
// Blood bank: Coimbatore city centre (swap for real coords in production)
const BLOODBANK_COORDS = [11.0168, 76.9558];

function mockPatientCoords(address) {
  const seed = (address?.length || 10) % 20;
  return [
    BLOODBANK_COORDS[0] + 0.01 + seed * 0.001,
    BLOODBANK_COORDS[1] + 0.01 + seed * 0.001,
  ];
}

export default function TrackRequest() {
  const { id } = useParams();
  const location = useLocation();

  const stateData = location.state || {};
  const [request, setRequest]   = useState(stateData.request || null);
  const [loading, setLoading]   = useState(!stateData.request);
  const [approved, setApproved] = useState(
    stateData.request?.status?.toLowerCase() === "approved"
  );
  const [delivered, setDelivered] = useState(false); // user clicked "Arrived"

  const patientCoords = mockPatientCoords(request?.address);

  // Poll every 5 s until approved
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.get(`/requests/${id}`);
        if (!cancelled) {
          setRequest(res.data);
          setLoading(false);
          const s = res.data.status?.toLowerCase();
          if (s === "approved")  setApproved(true);
          if (s === "delivered") { setApproved(true); setDelivered(true); }
        }
      } catch (err) {
        console.error("Polling error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(() => {
      if (!approved) poll();
    }, 5000);

    return () => { cancelled = true; clearInterval(interval); };
  }, [id, approved]);

  // Called when patient presses "Blood Arrived"
  async function handleArrived() {
    await api.patch(`/requests/${id}`, { status: "Delivered" });
    setDelivered(true);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={S.centred}>
        <div style={S.pulse}>🩸</div>
        <p style={S.dimText}>Loading your request…</p>
      </div>
    );
  }

  // ── Declined ────────────────────────────────────────────────────────────────
  if (request?.status?.toLowerCase() === "declined") {
    return (
      <div style={S.centred}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>❌</div>
        <h2 style={S.bigTitle}>Request Declined</h2>
        <p style={S.dimText}>
          Your request could not be fulfilled at this time.
          <br />Please contact the blood bank or submit a new request.
        </p>
      </div>
    );
  }

  // ── Delivered thank-you ─────────────────────────────────────────────────────
  if (delivered) {
    return (
      <div style={S.centred}>
        <div style={S.successRing}>
          <span style={{ fontSize: 64 }}>🩸</span>
        </div>
        <h2 style={{ ...S.bigTitle, color: "#27ae60", fontSize: 28 }}>
          Blood Received! ✅
        </h2>
        <p style={S.dimText}>
          Thank you for confirming. The blood bank has been notified.
          <br />We hope for a speedy recovery! 💪
        </p>
        <div style={S.thankCard}>
          <Row label="Recipient"   value={request?.requesterName} />
          <Row label="Blood Group" value={request?.bloodGroup} />
          <Row label="Units"       value={`${request?.units} unit(s)`} />
          <Row label="Status"      value={
            <span style={S.greenBadge}>✅ Delivered</span>
          } />
        </div>
      </div>
    );
  }

  // ── Waiting for approval ────────────────────────────────────────────────────
  if (!approved) {
    return (
      <div style={S.centred}>
        <div style={S.pulseRing}>
          <span style={{ fontSize: 52 }}>🩸</span>
        </div>
        <h2 style={S.bigTitle}>Request Submitted!</h2>
        <p style={S.dimText}>
          Waiting for the blood bank to approve your request…
          <br />This page updates automatically every 5 seconds.
        </p>
        <div style={S.card}>
          <Row label="Name"        value={request?.requesterName} />
          <Row label="Blood Group" value={request?.bloodGroup} />
          <Row label="Units"       value={`${request?.units} unit(s)`} />
          <Row label="Status"      value={
            <span style={S.pendingBadge}>⏳ Pending</span>
          } />
        </div>
      </div>
    );
  }

  // ── Approved → full-screen tracker ─────────────────────────────────────────
  return (
    <DeliveryTracker
      bloodbankCoords={BLOODBANK_COORDS}
      patientCoords={patientCoords}
      requestInfo={{
        requesterName: request.requesterName,
        bloodGroup:    request.bloodGroup,
        units:         request.units,
      }}
      onArrived={handleArrived}
    />
  );
}

// ─── Shared row component ────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div style={S.row}>
      <span style={S.rowLabel}>{label}</span>
      <span style={S.rowValue}>{value}</span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  centred: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg,#0d0d0d 0%,#1a0505 100%)",
    padding: 32,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    textAlign: "center",
    color: "#fff",
  },
  pulse: {
    fontSize: 64,
    animation: "pulse 1.2s ease-in-out infinite",
    marginBottom: 16,
  },
  pulseRing: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "rgba(192,57,43,0.15)",
    border: "3px solid rgba(192,57,43,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    animation: "ripple 2s ease-out infinite",
  },
  successRing: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    background: "rgba(39,174,96,0.12)",
    border: "3px solid rgba(39,174,96,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    boxShadow: "0 0 40px rgba(39,174,96,0.2)",
  },
  bigTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#fff",
    marginBottom: 10,
  },
  dimText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    lineHeight: 1.8,
    marginBottom: 28,
    maxWidth: 360,
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "20px 28px",
    width: "100%",
    maxWidth: 380,
  },
  thankCard: {
    background: "rgba(39,174,96,0.07)",
    border: "1px solid rgba(39,174,96,0.2)",
    borderRadius: 16,
    padding: "20px 28px",
    width: "100%",
    maxWidth: 380,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  rowLabel: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  rowValue:  { color: "#fff", fontWeight: 600, fontSize: 14 },
  pendingBadge: {
    background: "rgba(255,165,0,0.18)",
    color: "#ffa500",
    borderRadius: 8,
    padding: "2px 10px",
    fontSize: 13,
    fontWeight: 600,
  },
  greenBadge: {
    background: "rgba(39,174,96,0.2)",
    color: "#27ae60",
    borderRadius: 8,
    padding: "2px 10px",
    fontSize: 13,
    fontWeight: 600,
  },
};
