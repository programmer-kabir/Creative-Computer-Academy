import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffDirectory from './pages/StaffDirectory';
import StaffProfile from './pages/StaffProfile';
import TaskOversight from './pages/TaskOversight';
import Reports from './pages/Reports';
import MasterReport from './pages/MasterReport';
import ReviewerReport from './pages/ReviewerReport';
import Messages from './pages/Messages';
import AttendanceDisputes from './pages/AttendanceDisputes';
import DailyRoster from './pages/DailyRoster';
import Settings from './pages/Settings';
import { Toaster } from 'sonner';

import LeaveManagement from './pages/LeaveManagement';

// Mock empty pages to avoid errors
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
    <h1 className="text-2xl font-bold text-slate-400">{title} Module - Coming Soon</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — Admin Only */}
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <AdminLayout><Messages /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute>
              <AdminLayout><StaffDirectory /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/staff/:id" element={
            <ProtectedRoute>
              <AdminLayout><StaffProfile /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute>
              <AdminLayout><TaskOversight /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/master-report" element={
            <ProtectedRoute>
              <AdminLayout><MasterReport /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <AdminLayout><Reports /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/reviewer-report" element={
            <ProtectedRoute>
              <AdminLayout><ReviewerReport /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute>
              <AdminLayout><DailyRoster /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/attendance-disputes" element={
            <ProtectedRoute>
              <AdminLayout><AttendanceDisputes /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/leave" element={
            <ProtectedRoute>
              <AdminLayout><LeaveManagement /></AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AdminLayout><Settings /></AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
