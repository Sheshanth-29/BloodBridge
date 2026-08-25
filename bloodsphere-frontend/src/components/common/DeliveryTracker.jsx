import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix default Leaflet icon paths broken by bundlers ────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Custom emoji markers ──────────────────────────────────────────────────────
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

// ─── Auto-fit map bounds ───────────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [80, 80] });
  }, [map, positions]);
  return null;
}

// ─── Invalidate map size when pip mode changes ────────────────────────────────
function InvalidateOnResize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 320);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

// ─── Linear interpolation ─────────────────────────────────────────────────────
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const TOTAL_SECONDS = 20 * 60;

/**
 * DeliveryTracker — full-screen with PIP minimize + back button + zoom controls
 *
 * Props:
 *   bloodbankCoords  [lat, lng]
 *   patientCoords    [lat, lng]
 *   requestInfo      { requesterName, bloodGroup, units }
 *   onArrived        () => void
 */
export default function DeliveryTracker({
  bloodbankCoords,
  patientCoords,
  requestInfo,
  onArrived,
}) {
  const navigate = useNavigate();
  const [progress, setProgress]     = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [mockDone, setMockDone]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [minimized, setMinimized]   = useState(false); // PIP mode
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  const vehiclePos = lerp(bloodbankCoords, patientCoords, Math.min(progress, 1));

  const eta = mockDone
    ? "Blood has arrived! 🎉"
    : secondsLeft >= 60
    ? `Arriving in ${Math.ceil(secondsLeft / 60)} min`
    : `Arriving in ${secondsLeft}s`;

  // ── Animation clock ───────────────────────────────────────────────────────
  useEffect(() => {
    startRef.current = performance.now();
    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const t = Math.min(elapsed / TOTAL_SECONDS, 1);
      setProgress(t);
      setSecondsLeft(Math.max(0, Math.round(TOTAL_SECONDS - elapsed)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setMockDone(true);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Clean up Leaflet body/html overflow on unmount (fixes white page on back) 
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const steps = [
    { icon: "✅", label: "Request approved", done: true },
    { icon: "🚑", label: "Blood dispatched", done: progress > 0.05 },
    { icon: "📍", label: "En route",         done: progress > 0.1  },
    { icon: "🏠", label: "Delivered",        done: mockDone        },
  ];

  const dotted = [bloodbankCoords, patientCoords];
  const driven = [bloodbankCoords, vehiclePos];

  // ════════════════════════════════════════════════════════════════
  //  SINGLE RENDER TREE — minimized toggled via CSS visibility
  //  so the page background is ALWAYS present (no blank white page)
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Full-page dark background — always rendered so no blank screen ── */}
      <div style={S.root}>

        {/* ════════ FULL-SCREEN MAP (hidden when minimized) ════════ */}
        <div style={{ ...S.mapLayer, display: minimized ? "none" : "block" }}>
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
            <ZoomControl position="bottomleft" />
            <Polyline positions={dotted} pathOptions={{ color: "#c0392b", weight: 4, dashArray: "10 8", opacity: 0.35 }} />
            <Polyline positions={driven} pathOptions={{ color: "#e74c3c", weight: 5, opacity: 1 }} />
            <Marker position={bloodbankCoords} icon={BLOODBANK_ICON} />
            <Marker position={patientCoords}   icon={PATIENT_ICON} />
            {!mockDone && <Marker position={vehiclePos} icon={VEHICLE_ICON} />}
            {mockDone  && <Marker position={patientCoords} icon={DONE_ICON} />}
            <FitBounds positions={dotted} />
            <InvalidateOnResize trigger={minimized} />
          </MapContainer>
        </div>

        {/* ════════ TOP STATUS OVERLAY (hidden when minimized) ════════ */}
        {!minimized && (
          <div style={S.topOverlay}>
            <div style={S.statusCard}>
              {/* ← Back button */}
              <button
                style={S.backBtn}
                onClick={() => navigate(-1)}
                title="Go back"
              >
                ←
              </button>

              {/* Status info */}
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

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* ETA badge */}
                <div style={S.etaBadge}>
                  <div style={S.etaLabel}>ETA</div>
                  <div style={S.etaValue}>{eta}</div>
                </div>

                {/* ⊟ Minimize button */}
                <button
                  style={S.minimizeBtn}
                  onClick={() => setMinimized(true)}
                  title="Minimize to mini player"
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>⊟</span>
                </button>
              </div>
            </div>

            {/* Glowing progress bar */}
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        {/* ════════ BOTTOM PANEL OVERLAY (hidden when minimized) ════════ */}
        {!minimized && (
          <div style={S.bottomOverlay}>
            {/* Step indicators */}
            <div style={S.steps}>
              {steps.map((s, i) => (
                <div key={i} style={S.step}>
                  <div style={{
                    ...S.stepDot,
                    background: s.done ? "linear-gradient(135deg,#c0392b,#e74c3c)" : "rgba(255,255,255,0.1)",
                    boxShadow:  s.done ? "0 0 14px rgba(231,76,60,0.6)" : "none",
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
                try { await onArrived(); }
                finally { setConfirming(false); }
              }}
              disabled={confirming}
              style={{ ...S.arrivedBtn, opacity: confirming ? 0.7 : 1, transform: confirming ? "scale(0.97)" : "scale(1)" }}
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
        )}

        {/* ════════ MINIMIZED: dark backdrop + info strip ════════ */}
        {minimized && (
          <div style={S.minimizedBg}>
            <p style={S.minimizedHint}>Tracker minimized — tap the widget to expand</p>
            <button
              style={S.minimizedBackBtn}
              onClick={() => navigate(-1)}
            >
              ← Back to requests
            </button>
          </div>
        )}
      </div>

      {/* ════════ PIP WIDGET — rendered outside the page so it floats ════════ */}
      {minimized && (
        <div style={S.pipRoot}>
          {/* ── Expand notch tab ── */}
          <button style={S.pipTab} onClick={() => setMinimized(false)}>
            <span style={S.pipTabArrow}>▲</span>
            <span style={S.pipTabText}>Expand Tracker</span>
          </button>

          {/* ── Mini map ── */}
          <div style={S.pipMapWrap}>
            <MapContainer
              center={lerp(bloodbankCoords, patientCoords, 0.5)}
              zoom={13}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              scrollWheelZoom={false}
              dragging={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={dotted} pathOptions={{ color: "#c0392b", weight: 3, dashArray: "8 6", opacity: 0.35 }} />
              <Polyline positions={driven} pathOptions={{ color: "#e74c3c", weight: 4, opacity: 1 }} />
              <Marker position={bloodbankCoords} icon={BLOODBANK_ICON} />
              <Marker position={patientCoords}   icon={PATIENT_ICON} />
              {!mockDone && <Marker position={vehiclePos} icon={VEHICLE_ICON} />}
              {mockDone  && <Marker position={patientCoords} icon={DONE_ICON} />}
              <InvalidateOnResize trigger={minimized} />
            </MapContainer>

            {/* Click-to-expand overlay */}
            <div style={S.pipMapOverlay} onClick={() => setMinimized(false)} title="Click to expand" />
          </div>

          {/* ── Mini info bar ── */}
          <div style={S.pipInfoBar}>
            <span style={{ fontSize: 18 }}>🩸</span>
            <div style={S.pipInfoText}>
              <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{requestInfo.bloodGroup}</span>
              {" · "}{requestInfo.units} unit(s)
            </div>
            <div style={S.pipEta}>{eta}</div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  // ── Full-screen root ──────────────────────────────────────────────────────
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    background: "#0d0d0d", // always dark — never blank white
  },

  // ── Map layer (fills root, hidden when minimized) ──────────────────────────
  mapLayer: {
    position: "absolute",
    inset: 0,
  },

  // ── Minimized background — shown instead of map when PIP is active ─────────
  minimizedBg: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    background: "linear-gradient(160deg,#0d0d0d 0%,#1a0505 100%)",
  },
  minimizedHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    margin: 0,
    letterSpacing: 0.3,
  },
  minimizedBackBtn: {
    padding: "10px 24px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    cursor: "pointer",
    letterSpacing: 0.3,
    transition: "background 0.2s",
  },

  // ── Back button ───────────────────────────────────────────────────────────
  backBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 20,
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.2s",
    marginRight: 4,
  },

  // ── Minimize button ───────────────────────────────────────────────────────
  minimizeBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    color: "#fff",
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.2s",
  },

  // ── Top overlay ───────────────────────────────────────────────────────────
  topOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 400,
    pointerEvents: "auto",
  },
  statusCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px 10px",
    background: "rgba(10,0,0,0.82)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(192,57,43,0.3)",
    gap: 10,
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bloodDrop: {
    fontSize: 28,
    filter: "drop-shadow(0 2px 8px rgba(192,57,43,0.9))",
    flexShrink: 0,
  },
  statusTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.3,
  },
  statusSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  etaBadge: {
    background: "linear-gradient(135deg,#8b0000,#c0392b)",
    borderRadius: 10,
    padding: "7px 14px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(192,57,43,0.6)",
    minWidth: 100,
  },
  etaLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  etaValue: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
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

  // ── Bottom overlay ────────────────────────────────────────────────────────
  bottomOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
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
    width: 42, height: 42,
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

  // ── Arrived button ────────────────────────────────────────────────────────
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
    width: 16, height: 16,
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

  // ── PIP / Minimized styles ────────────────────────────────────────────────
  pipRoot: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 300,
    zIndex: 9000,
    borderRadius: 16,
    overflow: "visible",
    boxShadow: "0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(192,57,43,0.4)",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    animation: "slideUpPip 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  },

  // The pull-tab notch above the PIP card
  pipTab: {
    position: "absolute",
    top: -36,
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg,#8b0000,#c0392b)",
    color: "#fff",
    border: "none",
    borderRadius: "10px 10px 0 0",
    padding: "6px 18px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 -4px 14px rgba(192,57,43,0.5)",
    whiteSpace: "nowrap",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },
  pipTabArrow: {
    fontSize: 12,
    animation: "bounce 1.4s ease-in-out infinite",
  },
  pipTabText: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Mini map
  pipMapWrap: {
    width: "100%",
    height: 170,
    borderRadius: "16px 16px 0 0",
    overflow: "hidden",
    position: "relative",
    background: "#1a1a1a",
  },
  // Transparent overlay so click-to-expand works on the whole map area
  pipMapOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 500,
    cursor: "pointer",
    background: "transparent",
  },

  // Mini info bar
  pipInfoBar: {
    background: "rgba(10,0,0,0.92)",
    backdropFilter: "blur(12px)",
    borderRadius: "0 0 16px 16px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderTop: "1px solid rgba(192,57,43,0.3)",
  },
  pipInfoText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: 500,
  },
  pipEta: {
    color: "#ff6b6b",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
};
