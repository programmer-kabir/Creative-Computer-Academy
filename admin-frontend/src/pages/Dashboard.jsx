import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import BreakMonitor from '../components/BreakMonitor';
import AttendanceListWidget from '../components/AttendanceListWidget';

const StatCard = ({ title, value, subtitle, icon, color, darkColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex items-start justify-between transition-colors">
    <div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
      {subtitle && <p className={`text-xs mt-2 font-medium ${subtitle.color}`}>{subtitle.text}</p>}
    </div>
    <div className={`p-4 rounded-xl ${color} ${darkColor || ''}`}>
      {icon}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_staff: 0,
    present_today: 0,
    tasks_completed: 0,
    pending_approvals: { total: 0, leaves: 0, tasks: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/admin/dashboard/get_stats.php`);
        if (res.data.status === 'success') {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
      return <div className="p-8 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Welcome back, Admin. Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Staff" 
          value={stats.total_staff}
          subtitle={{ text: 'Active Members', color: 'text-slate-500 dark:text-slate-400' }}
          icon={<FiUsers size={24} />}
          color="bg-blue-50 text-blue-600"
          darkColor="dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard 
          title="Present Today" 
          value={stats.present_today}
          subtitle={{ text: 'Logged in today', color: 'text-slate-500 dark:text-slate-400' }}
          icon={<FiClock size={24} />}
          color="bg-emerald-50 text-emerald-600"
          darkColor="dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard 
          title="Tasks Completed" 
          value={stats.tasks_completed}
          subtitle={{ text: 'All time', color: 'text-slate-500 dark:text-slate-400' }}
          icon={<FiCheckCircle size={24} />}
          color="bg-purple-50 text-purple-600"
          darkColor="dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pending_approvals.total}
          subtitle={{ text: `${stats.pending_approvals.leaves} Leaves, ${stats.pending_approvals.tasks} Tasks`, color: 'text-rose-600 dark:text-rose-400' }}
          icon={<FiAlertCircle size={24} />}
          color="bg-orange-50 text-orange-600"
          darkColor="dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      {/* Placeholders for Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px]">
            <AttendanceListWidget />
        </div>
        <div className="min-h-[400px]">
            <BreakMonitor />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
