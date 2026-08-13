export default function Footer() {
  return (
    <footer className="bg-red-700 text-red-50 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-10">
        <div>
          <h3 className="text-white font-bold text-lg mb-2">BloodBridge</h3>
          <p className="text-sm text-red-100">
            A platform uniting hospitals, blood banks, donors, and patients —
            making blood donation faster, smarter, and more connected.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
          <p className="text-sm text-red-100">Email: support@bloodbridge.org</p>
          <p className="text-sm text-red-100">Phone: +91 98765 43210</p>
          <p className="text-sm text-red-100">Address: Coimbatore, India</p>
        </div>
      </div>

      <div className="border-t border-red-600 text-center py-4 text-xs text-red-200">
        © {new Date().getFullYear()} BloodBridge. All rights reserved.
      </div>
    </footer>
  );
}