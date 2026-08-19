import { Droplet, Mail, Phone, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-red-900 to-rose-950 text-red-50 mt-auto">

      {/* Heartbeat SVG divider */}
      <div className="w-full overflow-hidden opacity-20 text-rose-400 -mb-1">
        <svg viewBox="0 0 800 40" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
          <path
            d="M0,20 L100,20 L140,5 L180,35 L220,2 L260,38 L300,20 L400,20 L440,10 L480,30 L520,20 L800,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-10">

        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <Droplet size={16} className="text-white fill-white" />
            </div>
            <h3 className="text-white font-bold text-lg">BloodBridge</h3>
          </div>
          <p className="text-sm text-red-200 leading-relaxed max-w-xs">
            A platform uniting hospitals, blood banks, donors, and patients —
            making blood donation faster, smarter, and more connected.
          </p>
        </div>

        {/* Contact column */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Contact</h4>
          <div className="space-y-2.5">
            <p className="flex items-center gap-2.5 text-sm text-red-200">
              <Mail size={14} className="text-rose-400 shrink-0" />
              support@bloodbridge.org
            </p>
            <p className="flex items-center gap-2.5 text-sm text-red-200">
              <Phone size={14} className="text-rose-400 shrink-0" />
              +91 98765 43210
            </p>
            <p className="flex items-center gap-2.5 text-sm text-red-200">
              <MapPin size={14} className="text-rose-400 shrink-0" />
              Coimbatore, India
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-red-800/60 text-center py-4 text-xs text-red-300 flex items-center justify-center gap-1.5">
        © {new Date().getFullYear()} BloodBridge. Made with
        <Heart size={11} className="text-rose-400 fill-rose-400" />
        to save lives.
      </div>
    </footer>
  );
}