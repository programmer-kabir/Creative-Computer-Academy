import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiClock, FiCheckCircle, FiCalendar, FiBookOpen,
  FiAward, FiArrowRight, FiCheckSquare, FiAlertCircle, FiUserCheck
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/student/dashboard.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  // Handle Quick Check-In (Shared Attendance Table)
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_in.php`, {
        user_id: currentUser.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Checked in successfully!');
        fetchDashboardData();
      } else {
        toast.error(res.data.message || 'Check-in failed.');
      }
    } catch (err) {
      toast.error('Check-in error. Make sure you are connected to the network.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_out.php`, {
        user_id: currentUser.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Checked out successfully!');
        fetchDashboardData();
      } else {
        toast.error(res.data.message || 'Check-out failed.');
      }
    } catch (err) {
      toast.error('Check-out error.');
    } finally {
      setCheckingIn(false);
    }
  };

  const student = dashboardData?.student || currentUser;
  const stats = dashboardData?.stats || { attendance_rate: 100, present_days: 0, late_days: 0, total_days: 0 };
  const todayAtt = dashboardData?.today_attendance;

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      {/* Hero Banner with Course & Today's Attendance Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200 mb-3 border border-white/10">
              <FiAward size={14} />
              <span>Creative Computer Academy Student</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Hello, {student?.name || 'Student'}! 👋
            </h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-xl">
              Enrolled in <span className="text-white font-bold">{student?.course_name || student?.student_info?.course_name || 'Professional Course'}</span> ({student?.batch_no || student?.student_info?.batch_no || 'Batch-01'}).
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-indigo-300 font-semibold">Student Code</p>
              <p className="text-lg font-black font-mono mt-0.5">{student?.student_code || student?.student_info?.student_code || 'CCA-STU'}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-300 font-semibold">Overall Attendance</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{stats.attendance_rate}%</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-indigo-300 font-semibold">Present Days</p>
              <p className="text-lg font-black mt-0.5">{stats.present_days} Days</p>
            </div>
          </div>
        </div>

        {/* Daily Clock-in / Check-out Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Attendance</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live
              </span>
            </div>

            <div className="mt-4 text-center">
              <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {currentTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {currentTime.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {todayAtt?.check_in ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <FiCheckCircle size={16} />
                    <span>Checked In: {todayAtt.check_in.slice(0, 5)}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                    {todayAtt.status || 'Present'}
                  </span>
                </div>

                {!todayAtt.check_out ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingIn}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs"
                  >
                    {checkingIn ? 'Processing...' : 'Clock Out for Today'}
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Checked out at {todayAtt.check_out.slice(0, 5)}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <FiClock size={16} />
                <span>{checkingIn ? 'Recording...' : 'Check In Attendance'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Rate</span>
            <FiUserCheck size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.attendance_rate}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Calculated from total class sessions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Present</span>
            <FiCheckCircle size={20} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.present_days} Days</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Attended on time</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Late Days</span>
            <FiClock size={20} />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.late_days || 0} Days</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded late arrivals</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignments</span>
            <FiCheckSquare size={20} />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">Active</p>
          <Link to="/assignments" className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 mt-0.5">
            <span>View Tasks</span>
            <FiArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* My Batch Schedule & Course Curriculum Row */}
      {dashboardData?.batch_info && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl">
                <FiCalendar size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {dashboardData.batch_info.batch_name}
                  </h3>
                  <span className="font-mono text-xs font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {dashboardData.batch_info.batch_code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{dashboardData.batch_info.course_title}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                <span className="text-slate-400">Days:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dashboardData.batch_info.schedule_days}</span>
              </div>
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                <span className="text-slate-400">Time:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dashboardData.batch_info.schedule_time}</span>
              </div>
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-2">
                <span className="text-slate-400">Lab:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{dashboardData.batch_info.lab_room || 'Main Lab'}</span>
              </div>
              {dashboardData.batch_info.instructor_name && (
                <div className="px-3.5 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl flex items-center gap-1.5 font-bold">
                  <span>👨‍🏫 Lead: {dashboardData.batch_info.instructor_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Curriculum Modules */}
          {dashboardData.modules && dashboardData.modules.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Course Modules & Syllabus ({dashboardData.modules.length} Modules)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dashboardData.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center shrink-0 text-xs">
                      M{mod.module_no}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{mod.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{mod.description || 'Theory & Practical Tasks'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation Cards & Recent Attendance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Logs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">
                <FiCalendar size={18} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Attendance Logs</h3>
            </div>
            <Link to="/attendance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Full History →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading attendance logs...</div>
          ) : !dashboardData?.recent_logs || dashboardData.recent_logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <FiClock size={32} className="mx-auto mb-2 opacity-40" />
              No attendance logs recorded yet. Check in to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dashboardData.recent_logs.slice(0, 6).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{log.check_in || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{log.check_out || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.status === 'Present'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links & Resources Card */}
        <div className="space-y-4">
          <Link
            to="/assignments"
            className="block p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                <FiCheckSquare size={22} />
              </div>
              <FiArrowRight size={18} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-4">Assignments & Tasks</h4>
            <p className="text-xs text-slate-400 mt-1">Submit your practical projects, assignments, and view reviewer feedback.</p>
          </Link>

          <Link
            to="/resources"
            className="block p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                <FiBookOpen size={22} />
              </div>
              <FiArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-4">Course Resources & Assets</h4>
            <p className="text-xs text-slate-400 mt-1">Download class materials, design templates, and software resources.</p>
          </Link>

          <Link
            to="/profile"
            className="block p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                <FiAward size={22} />
              </div>
              <FiArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mt-4">Digital Student ID Card</h4>
            <p className="text-xs text-slate-400 mt-1">View official academy student card, batch details, and profile.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
