import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix default Leaflet icon paths broken by bundlers ───────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Custom emoji markers ─────────────────────────────────────────────────────
function emojiIcon(emoji, size = 42) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">${emoji}</div>`,
    className: "",
    iconAnchor: [size / 2, size / 2],
  });
}

const BLOODBANK_ICON = emojiIcon("🏥", 44);
const PATIENT_ICON   = emojiIcon("🏠", 44);
const VEHICLE_ICON   = emojiIcon("🚑", 44);
const DONE_ICON      = emojiIcon("✅", 44);

// ─── Auto-fit map bounds ──────────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [80, 80] });
    }
  }, [map, positions]);
  return null;
}

// ─── Linear interpolation ────────────────────────────────────────────────────
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const TOTAL_SECONDS = 20 * 60; // 20 min mock

/**
 * DeliveryTracker — full-screen, Zomato-style
 *
 * Props:
 *   bloodbankCoords  [lat, lng]
 *   patientCoords    [lat, lng]
 *   requestInfo      { requesterName, bloodGroup, units }
 *   onArrived        () => void   — called when user confirms receipt
 */
export default function DeliveryTracker({
  bloodbankCoords,
  patientCoords,
  requestInfo,
  onArrived,
}) {
  const [progress, setProgress]       = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [mockDone, setMockDone]       = useState(false); // animation ended
  const [confirming, setConfirming]   = useState(false); // "Arrived" mid-request
  const rafRef  = useRef(null);
  const startRef = useRef(null);

  const vehiclePos = lerp(bloodbankCoords, patientCoords, Math.min(progress, 1));

  const eta = mockDone
    ? "Blood has arrived! 🎉"
    : secondsLeft >= 60
    ? `Arriving in ${Math.ceil(secondsLeft / 60)} min`
    : `Arriving in ${secondsLeft}s`;

  // Run animation clock
  useEffect(() => {
    startRef.current = performance.now();
    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const t = Math.min(elapsed / TOTAL_SECONDS, 1);
      setProgress(t);
      setSecondsLeft(Math.max(0, Math.round(TOTAL_SECONDS - elapsed)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setMockDone(true);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const steps = [
    { icon: "✅", label: "Request approved",      done: true },
    { icon: "🚑", label: "Blood dispatched",       done: progress > 0.05 },
    { icon: "📍", label: "En route",               done: progress > 0.1 },
    { icon: "🏠", label: "Delivered",              done: mockDone },
  ];

  const dotted = [bloodbankCoords, patientCoords];
  const driven = [bloodbankCoords, vehiclePos];

  return (
    <div style={S.root}>
      {/* ════════════ FULL-SCREEN MAP ════════════ */}
      <MapContainer
        center={lerp(bloodbankCoords, patientCoords, 0.5)}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route lines */}
        <Polyline
          positions={dotted}
          pathOptions={{ color: "#c0392b", weight: 4, dashArray: "10 8", opacity: 0.35 }}
        />
        <Polyline
          positions={driven}
          pathOptions={{ color: "#e74c3c", weight: 5, opacity: 1 }}
        />

        {/* Fixed markers */}
        <Marker position={bloodbankCoords} icon={BLOODBANK_ICON} />
        <Marker position={patientCoords}   icon={PATIENT_ICON} />

        {/* Moving vehicle */}
        {!mockDone && <Marker position={vehiclePos} icon={VEHICLE_ICON} />}
        {mockDone  && <Marker position={patientCoords} icon={DONE_ICON} />}

        <FitBounds positions={dotted} />
      </MapContainer>

      {/* ════════════ TOP STATUS OVERLAY ════════════ */}
      <div style={S.topOverlay}>
        <div style={S.statusCard}>
          <div style={S.statusLeft}>
            <span style={S.bloodDrop}>🩸</span>
            <div>
              <div style={S.statusTitle}>
                {mockDone ? "Blood has arrived! 🎉" : "Blood on the way!"}
              </div>
              <div style={S.statusSub}>
                <strong style={{ color: "#ff6b6b" }}>{requestInfo.bloodGroup}</strong>
                {" · "}{requestInfo.units} unit(s){" · "}{requestInfo.requesterName}
              </div>
            </div>
          </div>
          <div style={S.etaBadge}>
            <div style={S.etaLabel}>ETA</div>
            <div style={S.etaValue}>{eta}</div>
          </div>
        </div>

        {/* Glowing progress bar */}
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* ════════════ BOTTOM PANEL OVERLAY ════════════ */}
      <div style={S.bottomOverlay}>
        {/* Step indicators */}
        <div style={S.steps}>
          {steps.map((s, i) => (
            <div key={i} style={S.step}>
              <div style={{
                ...S.stepDot,
                background: s.done
                  ? "linear-gradient(135deg,#c0392b,#e74c3c)"
                  : "rgba(255,255,255,0.1)",
                boxShadow: s.done ? "0 0 14px rgba(231,76,60,0.6)" : "none",
              }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
              </div>
              <span style={{ ...S.stepLabel, color: s.done ? "#fff" : "rgba(255,255,255,0.3)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── ARRIVED BUTTON ── */}
        <button
          onClick={async () => {
            if (confirming) return;
            setConfirming(true);
            try {
              await onArrived();
            } finally {
              setConfirming(false);
            }
          }}
          disabled={confirming}
          style={{
            ...S.arrivedBtn,
            opacity: confirming ? 0.7 : 1,
            transform: confirming ? "scale(0.97)" : "scale(1)",
          }}
        >
          {confirming ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={S.spinner} /> Confirming…
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              Blood Arrived — Mark as Received
            </span>
          )}
        </button>

        <div style={S.footerBrand}>🩸 BloodBridge Live Tracking</div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* ── Top overlay ── */
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 400,
    pointerEvents: "auto",
  },
  statusCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px 10px",
    background: "rgba(10,0,0,0.82)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(192,57,43,0.3)",
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  bloodDrop: {
    fontSize: 32,
    filter: "drop-shadow(0 2px 8px rgba(192,57,43,0.9))",
  },
  statusTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.3,
  },
  statusSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  etaBadge: {
    background: "linear-gradient(135deg,#8b0000,#c0392b)",
    borderRadius: 12,
    padding: "8px 16px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(192,57,43,0.6)",
    minWidth: 110,
  },
  etaLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  etaValue: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  progressTrack: {
    height: 4,
    background: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg,#8b0000,#e74c3c,#ff6b6b)",
    transition: "width 1s linear",
    boxShadow: "0 0 14px rgba(255,107,107,0.9)",
  },

  /* ── Bottom overlay ── */
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 400,
    background: "rgba(10,0,0,0.88)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(192,57,43,0.25)",
    padding: "18px 20px 24px",
    pointerEvents: "auto",
  },
  steps: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.5s ease",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: 600,
    textAlign: "center",
    maxWidth: 68,
    lineHeight: 1.3,
    transition: "color 0.5s",
    letterSpacing: 0.2,
  },

  /* ── Arrived button ── */
  arrivedBtn: {
    width: "100%",
    padding: "16px 24px",
    background: "linear-gradient(135deg,#1a6b1a,#27ae60)",
    border: "none",
    borderRadius: 16,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: 0.3,
    boxShadow: "0 6px 30px rgba(39,174,96,0.4), 0 2px 8px rgba(0,0,0,0.4)",
    transition: "all 0.2s ease",
    marginBottom: 10,
  },
  spinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  footerBrand: {
    textAlign: "center",
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};
