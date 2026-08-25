import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PageTransition from "./components/common/PageTransition";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Landing from "./pages/shared/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import RequestBlood from "./pages/patient/RequestBlood";
import TrackRequest from "./pages/patient/TrackRequest";

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
              <Route path="/" element={<PageTransition><Landing /></PageTransition>} />

              <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

              {/* Open access — no login required */}
              <Route path="/request-blood" element={<PageTransition><RequestBlood /></PageTransition>} />
              <Route path="/track/:id" element={<TrackRequest />} />

              <Route
                path="/donor/dashboard"
                element={
                  <ProtectedRoute allowedRole="donor">
                    <PageTransition><DonorDashboard /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital/dashboard"
                element={
                  <ProtectedRoute allowedRole="hospital">
                    <PageTransition><HospitalDashboard /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bloodbank/dashboard"
                element={
                  <ProtectedRoute allowedRole="bloodbank">
                    <PageTransition><BloodBankDashboard /></PageTransition>
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