import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Landing from "./pages/shared/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import RequestBlood from "./pages/patient/RequestBlood";

import DonorDashboard from "./pages/donor/DonorDashboard";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import BloodBankDashboard from "./pages/bloodbank/BloodBankDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Open access — no login required */}
              <Route path="/request-blood" element={<RequestBlood />} />

              <Route
                path="/donor/dashboard"
                element={
                  <ProtectedRoute allowedRole="donor">
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital/dashboard"
                element={
                  <ProtectedRoute allowedRole="hospital">
                    <HospitalDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloodbank/dashboard"
                element={
                  <ProtectedRoute allowedRole="bloodbank">
                    <BloodBankDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}