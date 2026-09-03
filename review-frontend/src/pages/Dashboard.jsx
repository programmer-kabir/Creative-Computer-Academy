import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiCheckCircle, FiClock, FiAlertCircle,
  FiRefreshCw, FiStar, FiChevronRight, FiList, FiEye, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ActivityHeatmap from '../components/ActivityHeatmap';
import AnimatedCounter from '../components/AnimatedCounter';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => {
  const colorMap = {
    brand:  'from-brand-500/20 to-brand-600/5 border-brand-500/20 text-brand-400',
    green:  'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    red:    'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    blue:   'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
  };
  const cls = colorMap[color];
  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass rounded-2xl p-5 bg-gradient-to-br border ${cls} flex items-start gap-4 transition-all`}
    >
      <div className={`p-2.5 rounded-xl ${cls.split(' ')[3]}/10`}>
        <Icon size={20} className={cls.split(' ')[3]} />
      </div>
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">
          <AnimatedCounter value={value} />
        </p>
        {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [team, setTeam]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all_time');

  useEffect(() => {
    const uid = currentUser.id;
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}api/reviewer/get_team_stats.php?reviewer_user_id=${uid}&time_filter=${timeFilter}`),
      axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${uid}`),
    ]).then(([sRes, tRes]) => {
      if (sRes.data.status === 'success') setStats(sRes.data);
      if (tRes.data.status === 'success') setTeam(tRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentUser, timeFilter]);

  if (loading) return (
    <div className="mx-auto space-y-6 animate-pulse p-2">
      <div className="h-10 bg-white/5 rounded-xl w-1/3 mb-8"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl"></div>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-white/5 rounded-2xl"></div>
        <div className="h-64 bg-white/5 rounded-2xl"></div>
      </div>
    </div>
  );

  const tp = stats?.top_performer;

  const chartData = [
    { name: 'Completed', value: parseInt(stats?.completed) || 0, color: '#10b981' }, // emerald-500
    { name: 'In Review', value: parseInt(stats?.in_review) || 0, color: '#a855f7' }, // purple-500
    { name: 'In Progress', value: parseInt(stats?.in_progress) || 0, color: '#3b82f6' }, // blue-500
    { name: 'To-Do', value: parseInt(stats?.todo) || 0, color: '#475569' } // slate-600
  ];
  const totalChartTasks = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className=" mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, <span className="text-brand-400">{currentUser?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's your team's work overview</p>
      </div>

      {/* Stats — task focused only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers}       label="Team Size"    value={stats?.team_count ?? 0}      color="brand" />
        <div onClick={() => navigate('/completed')} className="cursor-pointer">
          <StatCard icon={FiCheckCircle} label="Completed"    value={stats?.completed ?? 0}       sub={`${stats?.completion_rate ?? 0}% done ↗`} color="green" />
        </div>
        <div onClick={() => navigate('/pending')} className="cursor-pointer">
          <StatCard icon={FiEye}         label="In Review"    value={stats?.in_review ?? 0}       sub="Action needed ↗" color="purple" />
        </div>
        <StatCard icon={FiClock}       label="In Progress"  value={stats?.in_progress ?? 0}     color="yellow" />
      </div>

      {/* Task breakdown + Top performer */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Task breakdown */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 flex flex-col relative">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
              <FiList className="text-brand-400" /> Team Task Breakdown
            </h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-white/70 rounded-lg px-2 py-1 text-xs outline-none focus:border-brand-500/50 cursor-pointer"
            >
              <option value="all_time" className="bg-dark-900">All-Time</option>
              <option value="monthly" className="bg-dark-900">This Month</option>
              <option value="weekly" className="bg-dark-900">This Week</option>
              <option value="daily" className="bg-dark-900">Today</option>
            </select>
          </div>
          
          {totalChartTasks > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
              {/* Donut Chart */}
              <div className="w-48 h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.filter(d => d.value > 0)}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{totalChartTasks}</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40">Total Tasks</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="flex flex-col gap-3 min-w-[150px]">
                {chartData.map((entry) => {
                  const pct = totalChartTasks > 0 ? Math.round((entry.value / totalChartTasks) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-white/70 text-xs font-medium">{entry.name}</span>
                      </div>
                      <span className="text-white font-bold text-xs">{entry.value} <span className="text-white/30 font-normal ml-1">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              No tasks available to show.
            </div>
          )}
        </div>

        {/* Top Performer (this month) */}
        <div className="glass rounded-2xl p-6 border border-yellow-500/15 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <h2 className="text-white font-semibold mb-5 flex items-center gap-2 text-sm">
            <FiStar className="text-yellow-400" /> Top This Month
          </h2>
          {tp ? (
            <div
              className="flex flex-col items-center text-center cursor-pointer group"
              onClick={() => navigate(`/review/${tp.user_id}`)}
            >
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full border-2 border-yellow-400/40 overflow-hidden bg-white/10 mx-auto">
                  {tp.profile_picture
                    ? <img src={`${API_BASE}${tp.profile_picture}`} className="w-full h-full object-cover" alt={tp.name} />
                    : <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-yellow-400">{tp.name?.[0]}</span>
                  }
                </div>
                <span className="absolute -top-2 -right-2 text-xl">🏆</span>
              </div>
              <p className="text-white font-bold">{tp.name}</p>
              <p className="text-yellow-400 text-3xl font-black mt-2">
                {tp.score}<span className="text-sm text-yellow-400/50">/100</span>
              </p>
              <p className="text-white/30 text-xs mt-1">Work Score</p>
              <p className="text-white/40 text-xs mt-2">{tp.completed} / {tp.total} tasks done</p>
              <span className="mt-4 text-xs text-brand-400 group-hover:underline">View Full Review →</span>
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center mt-6">No task data this month yet.</p>
          )}
        </div>
      </div>

      {/* Reviewer Insights */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Review Speed Tracker */}
        <div className="glass rounded-2xl p-6 border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <FiActivity size={120} />
          </div>
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2 text-sm relative z-10">
            <FiActivity className="text-brand-400" /> Review Speed Tracker
          </h2>
          <p className="text-white/40 text-xs mb-6 relative z-10">Average time to process and review a task</p>
          
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-4xl font-black text-white tracking-tighter">14<span className="text-2xl text-white/40 font-medium ml-1">m</span> 30<span className="text-2xl text-white/40 font-medium ml-1">s</span></span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full mb-1 flex items-center gap-1 shadow-lg shadow-emerald-500/5">
              2.5m faster ↗
            </span>
          </div>
          <div className="mt-6 flex items-center gap-4 relative z-10">
             <div className="flex-1">
               <div className="flex justify-between text-[10px] text-white/50 mb-1.5 font-bold uppercase tracking-wider">
                 <span>Current Average</span>
                 <span>Target: 10m</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_10px_rgba(var(--brand-500-rgb),0.5)]" style={{ width: '65%' }} />
               </div>
             </div>
          </div>
        </div>

        {/* Accuracy Tracker (Optional second metric) */}
        <div className="glass rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
            <FiCheckCircle size={120} />
          </div>
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2 text-sm relative z-10">
            <FiCheckCircle className="text-emerald-400" /> First-Pass Approval Rate
          </h2>
          <p className="text-white/40 text-xs mb-6 relative z-10">Tasks approved without revisions</p>
          
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-4xl font-black text-white tracking-tighter">78<span className="text-2xl text-white/40 font-medium">%</span></span>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full mb-1 flex items-center gap-1 shadow-lg shadow-emerald-500/5">
              +5% ↗
            </span>
          </div>
          <div className="mt-6 flex items-center gap-4 relative z-10">
             <div className="flex-1">
               <div className="flex justify-between text-[10px] text-white/50 mb-1.5 font-bold uppercase tracking-wider">
                 <span>Current Rate</span>
                 <span>Target: 90%</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '85%' }} />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Row 3: Activity Heatmap */}
      <div className="grid grid-cols-1">
        <ActivityHeatmap />
      </div>

      {/* Team cards */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <FiUsers className="text-brand-400" /> My Team
          </h2>
          <button onClick={() => navigate('/team')}
            className="text-brand-400 text-sm hover:text-brand-300 transition-colors flex items-center gap-1">
            View all <FiChevronRight size={14} />
          </button>
        </div>

        {team.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-white/30">
            <FiAlertCircle size={32} className="mb-3" />
            <p className="text-sm">No team members assigned yet.</p>
            <p className="text-xs mt-1">Set <code className="bg-white/5 px-1 rounded">reporting_manager_id</code> in employees table.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {team.slice(0, 8).map(m => (
              <button
                key={m.user_id}
                onClick={() => navigate(`/review/${m.user_id}`)}
                className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-brand-500/20 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                  {m.profile_picture
                    ? <img src={`${API_BASE}${m.profile_picture}`} className="w-full h-full object-cover" alt={m.name} />
                    : <span className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">{m.name?.[0]}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate group-hover:text-brand-400 transition-colors">{m.name}</p>
                  <p className="text-white/40 text-xs truncate">{m.designation || m.department_name || '—'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
