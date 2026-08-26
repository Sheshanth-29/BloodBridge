import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import heroImage from "../../assets/background.jpg";
import handsDonateImage from "../../assets/hands_donate.png";
import { ArrowRight, UserPlus, Search, Heart, Droplet, ShieldCheck, Clock } from "lucide-react";

// ── Animated stat counter ──────────────────────────────────────────────────
function CountUp({ target, duration = 1800, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (ts) => {
            const progress = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * target));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(target);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ── Heartbeat SVG line ─────────────────────────────────────────────────────
function HeartbeatLine({ className = "" }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className={`heartbeat-line ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0,30 L60,30 L80,10 L100,50 L120,5 L140,55 L160,30 L220,30 L240,15 L260,45 L280,30 L400,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Fade-in-up section wrapper ─────────────────────────────────────────────
function FadeSection({ children, delay = "delay-0", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${delay} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Main Landing ───────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section
        className="relative min-h-[88vh] flex items-center justify-center text-center px-6 overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Rich overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-red-950/40 to-black/70" />

        {/* Heartbeat line accent */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-10 text-red-400 pointer-events-none">
          <HeartbeatLine className="w-full h-16" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-2xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-red-200 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <Droplet size={12} className="fill-red-400 text-red-400" />
            A Complete Blood Care Network
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
            BloodBridge —
            <br />
            <span className="text-rose-300">Connect. Donate.</span>
          </h1>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Save Lives.
          </h2>
          <p className="text-gray-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            A real-time platform connecting hospitals, blood banks, and donors efficiently.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:scale-105 transition-all duration-200 shadow-lg shadow-red-900/40"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-white px-6 py-12">
        <FadeSection className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Heart, label: "Lives Saved", target: 12400, suffix: "+", color: "text-red-600", bg: "bg-red-50 border-red-100" },
              { icon: Droplet, label: "Donors Registered", target: 8200, suffix: "+", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
              { icon: ShieldCheck, label: "Blood Banks Connected", target: 340, suffix: "+", color: "text-red-700", bg: "bg-red-50 border-red-100" },
            ].map(({ icon: Icon, label, target, suffix, color, bg }) => (
              <div
                key={label}
                className={`${bg} border rounded-2xl px-6 py-8 text-center shadow-sm hover:shadow-md transition-shadow`}
              >
                <Icon size={28} className={`${color} mx-auto mb-3`} />
                <div className={`text-4xl font-extrabold ${color} mb-1`}>
                  <CountUp target={target} suffix={suffix} />
                </div>
                <div className="text-gray-600 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* ── Divider with heartbeat ── */}
      <div className="flex items-center justify-center py-2 text-red-200">
        <HeartbeatLine className="w-64 h-8 opacity-60" />
      </div>

      {/* ── How it works ── */}
      <section
        className="relative px-6 py-16 overflow-hidden"
        style={{
          backgroundImage: `url(${handsDonateImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Soft white overlay so cards stay crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-red-50/88 to-white/95 pointer-events-none" />
        <div className="relative z-10">
        <FadeSection className="max-w-4xl mx-auto text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-3 block">Process</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How it works</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Three simple steps connect those in need with those who can help — faster than ever before.
          </p>
        </FadeSection>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden sm:block absolute top-14 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-red-200 via-rose-300 to-red-200 z-0" />

          {[
            {
              step: "01",
              icon: UserPlus,
              title: "Register",
              desc: "Sign up as a donor, hospital, or blood bank. Takes under 2 minutes.",
              delay: "delay-100",
            },
            {
              step: "02",
              icon: Search,
              title: "Match",
              desc: "Our platform instantly matches blood requests with compatible donors nearby.",
              delay: "delay-300",
            },
            {
              step: "03",
              icon: Heart,
              title: "Save a Life",
              desc: "Donate or receive blood with real-time tracking from request to delivery.",
              delay: "delay-500",
            },
          ].map(({ step, icon: Icon, title, desc, delay }) => (
            <FadeSection key={step} delay={delay} className="relative z-10">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-4 shadow-md shadow-red-200 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} className="text-white" />
                </div>
                <div className="text-xs font-bold text-red-400 mb-1 tracking-widest">{step}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <FadeSection>
        <section className="bg-gradient-to-r from-red-700 to-rose-600 px-6 py-14 text-center text-white">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 opacity-80">
              <Clock size={16} />
              <span className="text-sm">Every second counts in an emergency</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to make a difference?</h2>
            <p className="text-red-100 mb-8 text-lg">
              Join thousands of donors and healthcare providers already on BloodBridge.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-red-700 px-8 py-3.5 rounded-xl font-bold hover:bg-red-50 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Start Saving Lives <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </FadeSection>

    </div>
  );
}