import { Link } from "react-router-dom";
import heroImage from "../../assets/background.jpg";

export default function Landing() {
  return (
    <div
      className="relative min-h-[80vh] flex items-center justify-center text-center px-6"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay so the white text stays readable over the image */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
          BloodBridge – Connect. Donate.
        </h1>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Save Lives.
        </h1>
        <p className="text-gray-100 text-lg mb-8">
          A real-time platform connecting hospitals, blood banks, donors, and patients efficiently.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/signup" className="bg-red-600 text-white px-6 py-3 rounded-md font-medium hover:bg-red-700">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}