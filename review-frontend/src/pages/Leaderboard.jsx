import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiAward, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiCalendar, FiFilter, FiUser, FiClock, FiLayers,
  FiTrendingUp, FiArrowUpRight
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Months reference
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Available years for selection
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

// Score calculation formula: completion × 0.70 - rejection_penalty (max 30)
const calcScore = (completed, total, rejected) => {
  if (total === 0) return 0;
  const rate = Math.round((completed / total) * 100);
  const penalty = Math.min(30, Math.round((rejected / total) * 30));
  return Math.max(0, Math.min(100, Math.round(rate * 0.70 - penalty)));
};

const scoreColor = (s) =>
  s >= 80 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400'
  : s >= 60 ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30 dark:text-yellow-400'
  : s >= 40 ? 'text-orange-500 bg-orange-500/10 border-orange-500/30 dark:text-orange-400'
  :           'text-rose-500 bg-rose-500/10 border-rose-500/30 dark:text-rose-400';

const rankEmoji = (i) =>
  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month'); // 'this_month' | 'last_month' | 'specific_month' | 'all_time' | 'custom'
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0 - 11
  
  // Custom Date inputs
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Calculate active date range
  const activeDateRange = useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const todayStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (filterType === 'this_month') {
      const start = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`;
      return {
        start,
        end: todayStr,
        label: `This Month (${MONTH_NAMES[currentMonthIndex]} ${currentYear})`
      };
    }

    if (filterType === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonthIndex - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthIndex = lastMonthDate.getMonth();
      const lastDayOfLastMonth = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();
      const start = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-01`;
      const end = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-${String(lastDayOfLastMonth).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `Last Month (${MONTH_NAMES[lastMonthIndex]} ${lastMonthYear})`
      };
    }

    if (filterType === 'specific_month') {
      const y = parseInt(selectedYear) || currentYear;
      const m = parseInt(selectedMonth);
      const lastDay = new Date(y, m + 1, 0).getDate();
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `${MONTH_NAMES[m]} ${y}`
      };
    }

    if (filterType === 'all_time') {
      return {
        start: '2020-01-01',
        end: todayStr,
        label: 'All Time Total Performance'
      };
    }

    if (filterType === 'custom') {
      return {
        start: customStart,
        end: customEnd,
        label: `${customStart} to ${customEnd}`
      };
    }

    return {
      start: `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`,
      end: todayStr,
      label: `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`
    };
  }, [filterType, selectedYear, selectedMonth, customStart, customEnd]);

  // Load Team and Scores for the selected period
  const fetchLeaderboardData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      // 1. Fetch team members assigned to this reviewer
      const teamRes = await axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${currentUser.id}`);
      if (teamRes.data.status !== 'success') return;
      const members = teamRes.data.data || [];
      setTeam(members);

      // 2. Fetch task report for each member within the selected start & end dates
      const scoreMap = {};
      await Promise.all(
        members.map(async (m) => {
          try {
            const res = await axios.post(`${API_BASE}api/reports/get_task_report.php`, {
              user_id: m.user_id,
              start_date: activeDateRange.start,
              end_date: activeDateRange.end
            });
            const s = res.data?.summary;
            if (s) {
              const score = calcScore(s.total_completed, s.total_assigned, s.total_rejected);
              const rate = s.total_assigned > 0 ? Math.round((s.total_completed / s.total_assigned) * 100) : 0;
              scoreMap[m.user_id] = {
                score,
                rate,
                completed: s.total_completed,
                total: s.total_assigned,
                rejected: s.total_rejected,
                resubmitted: s.total_resubmitted,
                delayed: s.delayed_completions
              };
            }
          } catch {
            // Ignore single member report errors
          }
        })
      );
      setScores(scoreMap);
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeDateRange]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Sort team members by score descending
  const ranked = useMemo(() =>
    [...team].sort((a, b) => (scores[b.user_id]?.score ?? -1) - (scores[a.user_id]?.score ?? -1)),
    [team, scores]
  );

  // Aggregated totals across all members in this period
  const totals = useMemo(() => {
    let totalAssigned = 0;
    let totalCompleted = 0;
    let totalRejected = 0;
    Object.values(scores).forEach(s => {
      totalAssigned += (s.total || 0);
      totalCompleted += (s.completed || 0);
      totalRejected += (s.rejected || 0);
    });
    return { totalAssigned, totalCompleted, totalRejected };
  }, [scores]);

  return (
    <div className="mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* ──────── Header Section ──────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <FiAward size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Work Leaderboard
            </h1>
          </div>
          <p className="text-white/60 text-xs sm:text-sm font-medium flex items-center gap-2 flex-wrap">
            <span>Ranking by team task performance:</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{activeDateRange.label}</span>
            <span className="text-white/30 text-[11px] hidden sm:inline">
              (Formula: Completion × 70% − Rejection Penalty)
            </span>
          </p>
        </div>

        {/* Quick Refresh Button */}
        <button
          type="button"
          onClick={fetchLeaderboardData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 rounded-2xl glass hover:bg-dark-700 text-white font-bold text-xs border border-dark-800 shadow-2xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          title="Refresh leaderboard data"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ──────── Interactive Period Filter Bar ──────── */}
      <div className="glass rounded-3xl p-4 sm:p-5 border border-dark-800 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setFilterType('this_month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'this_month'
                  ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                  : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
              }`}
            >
              <FiCalendar size={13} />
              <span>This Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('last_month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'last_month'
                  ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                  : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
              }`}
            >
              <FiClock size={13} />
              <span>Last Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('specific_month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'specific_month'
                  ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                  : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
              }`}
            >
              <FiLayers size={13} />
              <span>Select Any Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all_time')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'all_time'
                  ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                  : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
              }`}
            >
              <FiTrendingUp size={13} />
              <span>All Time</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterType === 'custom'
                  ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                  : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
              }`}
            >
              <FiFilter size={13} />
              <span>Custom Dates</span>
            </button>
          </div>

          {/* Active Period Label Pill */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider hidden xl:inline">
              Period:
            </span>
            <div className="px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-extrabold flex items-center gap-1.5">
              <FiCalendar size={13} />
              <span>{activeDateRange.start} — {activeDateRange.end}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Secondary Controls for Specific Month or Custom Dates */}
        {filterType === 'specific_month' && (
          <div className="pt-3 border-t border-dark-800 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-white/60 flex items-center gap-1">
              <FiCalendar size={13} className="text-brand-400" />
              <span>Choose Target Month & Year:</span>
            </span>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-dark-700 border border-dark-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-dark-700 border border-dark-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <span className="text-[11px] text-white/40">
              (Shows complete monthly performance for {MONTH_NAMES[selectedMonth]} {selectedYear})
            </span>
          </div>
        )}

        {filterType === 'custom' && (
          <div className="pt-3 border-t border-dark-800 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">From Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-dark-700 border border-dark-800 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">To Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-dark-700 border border-dark-800 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Aggregated Period Stats Bar */}
        <div className="pt-3 border-t border-dark-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white/60">
              Total Team Members: <strong className="text-white">{team.length}</strong>
            </span>
            <span>•</span>
            <span className="text-white/60">
              Tasks Assigned: <strong className="text-white">{totals.totalAssigned}</strong>
            </span>
            <span>•</span>
            <span className="text-white/60">
              Completed: <strong className="text-emerald-500">{totals.totalCompleted}</strong>
            </span>
            <span>•</span>
            <span className="text-white/60">
              Rejected: <strong className="text-rose-500">{totals.totalRejected}</strong>
            </span>
          </div>
          <span className="text-[11px] text-white/40 italic">
            Click any member to open task inspection
          </span>
        </div>
      </div>

      {/* ──────── Leaderboard Podium / List ──────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 glass rounded-3xl border border-dark-800">
          <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
            Loading team ranking for {activeDateRange.label}...
          </p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border border-dark-800 text-white/40 space-y-2">
          <FiUser size={36} className="mx-auto text-white/30" />
          <h3 className="text-base font-bold text-white">No team members found</h3>
          <p className="text-xs">No team members are currently assigned to your review desk.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {ranked.map((m, i) => {
            const s = scores[m.user_id];
            const sc = s ? scoreColor(s.score) : 'text-white/40 bg-dark-700 border-dark-800';
            const isTop3 = i < 3;

            return (
              <div
                key={m.user_id}
                onClick={() => navigate(`/review/${m.user_id}`)}
                className={`w-full glass rounded-3xl p-4 sm:p-5 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:shadow-lg ${
                  isTop3
                    ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-r from-transparent via-amber-500/[0.02] to-transparent'
                    : 'border-dark-800 hover:border-brand-500/40'
                }`}
              >
                {/* Left: Rank, Avatar & Member Info */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-9 text-center shrink-0">
                    {rankEmoji(i) ? (
                      <span className="text-2xl sm:text-3xl drop-shadow-sm">{rankEmoji(i)}</span>
                    ) : (
                      <span className="text-white/40 font-black text-sm sm:text-base">
                        #{i + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-dark-700 border border-dark-800 overflow-hidden shrink-0 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {m.profile_picture ? (
                      <img
                        src={`${API_BASE}${m.profile_picture}`}
                        className="w-full h-full object-cover"
                        alt={m.name}
                      />
                    ) : (
                      <span className="font-black text-brand-400 text-lg">
                        {m.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Member Name & Designation */}
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-black text-sm sm:text-base group-hover:text-brand-400 transition-colors truncate">
                        {m.name}
                      </p>
                      {i === 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                          Top Performer
                        </span>
                      )}
                    </div>

                    <p className="text-white/50 text-xs truncate mt-0.5">
                      {m.designation || m.department_name || 'Creative Staff'}
                    </p>

                    {/* Breakdown Badges */}
                    {s && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-white/50 font-medium">
                        <span className="flex items-center gap-1">
                          <FiCheckCircle size={12} className="text-emerald-500" />
                          <strong className="text-white">{s.completed}/{s.total}</strong> done
                        </span>
                        <span className="flex items-center gap-1">
                          <FiXCircle size={12} className="text-rose-500" />
                          <strong className="text-white">{s.rejected}</strong> rejected
                        </span>
                        {s.resubmitted > 0 && (
                          <span className="flex items-center gap-1">
                            <FiRefreshCw size={11} className="text-yellow-500" />
                            <span>{s.resubmitted} resubmitted</span>
                          </span>
                        )}
                        {s.delayed > 0 && (
                          <span className="flex items-center gap-1">
                            <FiClock size={11} className="text-orange-400" />
                            <span>{s.delayed} delayed</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Progress Bar, Score Box & Arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-800">
                  {/* Completion Rate Bar */}
                  {s && (
                    <div className="w-28 hidden md:block text-right">
                      <div className="flex justify-between text-[11px] font-bold text-white/50 mb-1">
                        <span>Rate:</span>
                        <span className="text-white">{s.rate}%</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden border border-dark-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Score Card Box */}
                  <div className={`w-16 h-14 rounded-2xl border flex flex-col items-center justify-center shadow-xs shrink-0 ${sc}`}>
                    <span className="text-lg font-black leading-none tracking-tight">
                      {s?.score ?? 0}
                    </span>
                    <span className="text-[10px] font-extrabold opacity-60 mt-0.5">
                      / 100
                    </span>
                  </div>

                  {/* Inspect Arrow */}
                  <div className="w-8 h-8 rounded-xl bg-dark-700 group-hover:bg-brand-600 text-white/40 group-hover:text-[#ffffff] flex items-center justify-center transition-all shrink-0">
                    <FiArrowUpRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
