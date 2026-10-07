import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RealtimeAlertBanner from './components/RealtimeAlertBanner';
import QuickDemoBar from './components/QuickDemoBar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import BloodRequests from './pages/BloodRequests';
import DonationHistory from './pages/DonationHistory';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DonorManagement from './pages/DonorManagement';
import CreateBloodRequest from './pages/CreateBloodRequest';
import RequestDetails from './pages/RequestDetails';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-[#0a0d14] text-slate-100">
            <Navbar />
            <RealtimeAlertBanner />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                {/* Public Access */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/requests" element={<BloodRequests />} />
                <Route path="/requests/:id" element={<RequestDetails />} />

                {/* Student / Donor Access */}
                <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
                <Route path="/donations" element={<ProtectedRoute><DonationHistory /></ProtectedRoute>} />
                <Route path="/create-request" element={<ProtectedRoute><CreateBloodRequest /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                {/* Administrator Access */}
                <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/donors" element={<ProtectedRoute role="ADMIN"><DonorManagement /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute role="ADMIN"><Reports /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
            <QuickDemoBar />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

