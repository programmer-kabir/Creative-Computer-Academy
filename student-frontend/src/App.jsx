import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import StudentLayout from './layouts/StudentLayout';

// Lazy loading pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Assignments = React.lazy(() => import('./pages/Assignments'));
const Resources = React.lazy(() => import('./pages/Resources'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500 font-bold">Loading Student Portal...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Only for Students */}
            <Route path="/" element={
              <ProtectedRoute>
                <StudentLayout>
                  <Dashboard />
                </StudentLayout>
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute>
                <StudentLayout>
                  <Attendance />
                </StudentLayout>
              </ProtectedRoute>
            } />

            <Route path="/assignments" element={
              <ProtectedRoute>
                <StudentLayout>
                  <Assignments />
                </StudentLayout>
              </ProtectedRoute>
            } />

            <Route path="/resources" element={
              <ProtectedRoute>
                <StudentLayout>
                  <Resources />
                </StudentLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <StudentLayout>
                  <Profile />
                </StudentLayout>
              </ProtectedRoute>
            } />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
