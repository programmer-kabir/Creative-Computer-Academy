import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiActivity,
  FiLayers,
  FiCrosshair,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiChevronDown
} from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const CustomSelect = ({ value, onChange, options, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm font-bold rounded-2xl h-12 pl-10 pr-4 outline-none hover:bg-slate-100 dark:bg-slate-800/50/80 hover:border-slate-300 transition-all text-left shadow-sm/50"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
          {Icon && <Icon size={16} />}
        </div>
        <span className="truncate mr-2">{selectedOption?.label}</span>
        <FiChevronDown size={18} className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto overflow-x-hidden p-2 animate-in fade-in slide-in-from-top-4">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-colors truncate ${String(value) === String(opt.value)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-slate-900'
                  }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ReviewerReport = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewerReport, setReviewerReport] = useState(null);
  const [error, setError] = useState('');

  const reviewerOptions = useMemo(() => {
    return staffList
      .map(staff => ({
        value: staff.id,
        label: `${staff.name} (${staff.designation || 'Reviewer'})`
      }));
  }, [staffList]);

  const periodOptions = [
    { value: 'today', label: 'Daily (Today)' },
    { value: 'weekly', label: 'Weekly (Current Week)' },
    { value: 'monthly', label: 'Monthly (This Month)' },
    { value: 'custom', label: 'Custom Range' }
  ];
  const [periodType, setPeriodType] = useState('monthly');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/admin/reviewer/get_all_reviewers.php`);
        if (res.data.status === 'success') {
          setStaffList(res.data.data);
          const reviewers = res.data.data;
          if (reviewers.length > 0) {
            setSelectedStaffId(reviewers[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff list', err);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    const today = new Date();
    if (periodType === 'today') {
      const d = today.toISOString().split('T')[0];
      setStartDate(d); setEndDate(d);
    } else if (periodType === 'weekly') {
      const startOfWeek = new Date(today);
      const daysToSubtract = (today.getDay() + 1) % 7;
      startOfWeek.setDate(today.getDate() - daysToSubtract);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(endOfWeek.toISOString().split('T')[0]);
    } else if (periodType === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [periodType]);

  const fetchReport = async () => {
    if (!selectedStaffId || !startDate || !endDate) {
      setError('Please select a reviewer and a valid date range.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const revRes = await axios.post(`${API_BASE}api/reports/get_reviewer_micro_analytics.php`, {
        reviewer_user_id: selectedStaffId,
        start_date: startDate,
        end_date: endDate
      });

      if (revRes && revRes.data.status === 'success') {
        setReviewerReport(revRes.data);
      } else {
        setReviewerReport(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStaffId && startDate && endDate && periodType !== 'custom') {
      fetchReport();
    }
  }, [selectedStaffId, startDate, endDate, periodType]);

  const handleExport = () => {
    if (!reviewerReport || !reviewerReport.history || reviewerReport.history.length === 0) return;

    const selectedStaffInfo = staffList.find(s => String(s.id) === String(selectedStaffId)) || { name: 'Unknown' };

    const downloadCSV = (filename, csvData) => {
      const csvString = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    const headers = ['Task', 'Staff Name', 'Priority', 'Status', 'Submitted At', 'Reviewed At', 'Review Time'];
    const rows = reviewerReport.history.map(r => [
      `"${r.title}"`,
      `"${r.staff_name}"`,
      `"${r.priority || '-'}"`,
      `"${r.status}"`,
      `"${r.submitted_at || '-'}"`,
      `"${r.reviewed_at || '-'}"`,
      `"${r.review_time || '-'}"`
    ]);
    downloadCSV(`${selectedStaffInfo.name}_reviewer_analytics.csv`, [headers, ...rows]);
  };

  const selectedStaffInfo = staffList.find(s => String(s.id) === String(selectedStaffId));

  const totalReviewed = reviewerReport?.summary?.total_reviewed || 0;
  const approvedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_approved / totalReviewed) * 100) : 0;
  const rejectedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_rejected / totalReviewed) * 100) : 0;

  const slaTotal = (reviewerReport?.summary?.sla_met || 0) + (reviewerReport?.summary?.sla_breached || 0);
  const slaRate = slaTotal > 0 ? Math.round(((reviewerReport.summary.sla_met || 0) / slaTotal) * 100) : 100;

  return (
    <div className=" mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Reviewer Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Analyze reviewer SLAs, bounce rates, and task queue bottlenecks.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Reviewer Selection</label>
              <CustomSelect
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={reviewerOptions}
                icon={FiUsers}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Time Period</label>
              <CustomSelect
                value={periodType}
                onChange={setPeriodType}
                options={periodOptions}
                icon={FiClock}
              />
            </div>
          </div>

          <div className="flex items-end gap-3 shrink-0">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 min-w-[140px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiRefreshCw size={18} />
                  <span>Generate</span>
                </>
              )}
            </button>
            <button
              onClick={handleExport}
              disabled={loading || !reviewerReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition-colors shadow-md shadow-blue-500/10 disabled:opacity-50 min-w-[140px]"
            >
              <FiDownload size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {periodType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl animate-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 font-bold animate-in fade-in">
          <FiAlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {selectedStaffInfo && !loading && !error && reviewerReport && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {(reviewerReport.summary.sla_breached > 0 || Object.keys(reviewerReport.insights.top_friction).length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviewerReport.summary.sla_breached > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-rose-500">
                    <FiAlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-rose-800 uppercase tracking-wider text-xs">SLA Breach Alert</h4>
                    <p className="text-sm text-rose-700 mt-1 font-medium">This reviewer has <b>{reviewerReport.summary.sla_breached} tasks</b> that took longer than 24 hours to review.</p>
                  </div>
                </div>
              )}
              {Object.keys(reviewerReport.insights.top_friction).length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-amber-500">
                    <FiActivity size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-800 dark:text-amber-500 uppercase tracking-wider text-xs">Friction Insight</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                      Highest rejection rate observed with <b>{Object.keys(reviewerReport.insights.top_friction)[0]}</b> ({Object.values(reviewerReport.insights.top_friction)[0]} rejections).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiLayers /> Total Received</p>
              <h3 className="text-3xl font-black text-slate-850 dark:text-slate-100">{reviewerReport.summary.total_received}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiCrosshair /> Total Reviewed</p>
              <h3 className="text-3xl font-black text-blue-700 dark:text-blue-400">{reviewerReport.summary.total_reviewed}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiClock /> In Review</p>
              <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{reviewerReport.summary.currently_pending}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiCheckCircle /> Approved</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{reviewerReport.summary.total_approved}</h3>
                <span className="text-sm font-bold text-emerald-500 mb-1">({approvedRate}%)</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiXCircle /> Rejected</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{reviewerReport.summary.total_rejected}</h3>
                <span className="text-sm font-bold text-rose-500 mb-1">({rejectedRate}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avg. Review Speed</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.summary.avg_review_hours || 'N/A'}</h3>
              </div>
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center">
                <FiClock size={20} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Avg. Iteration Loops</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.insights.avg_iterations || 0}x</h3>
              </div>
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center">
                <FiRefreshCw size={20} />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FiActivity /> SLA Met</p>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{slaRate}%</h3>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2 mb-2 overflow-hidden flex">
                <div className={`h-2 transition-all duration-1000 ${slaRate >= 90 ? 'bg-emerald-500' : slaRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${slaRate}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {reviewerReport.summary.sla_met || 0} Met &bull; {reviewerReport.summary.sla_breached || 0} Breached
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reviewerReport.insights?.speed_trend && reviewerReport.insights.speed_trend.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                <div className="mb-6">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2"><FiActivity className="text-blue-500" /> Review Speed Trend</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Daily average turnaround time (in hours).</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reviewerReport.insights.speed_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e293b' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 900 }}
                        formatter={(value) => [`${value} hours`, 'Avg Speed']}
                      />
                      <Line type="monotone" dataKey="avg_hours" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {reviewerReport.insights?.workload_trend && reviewerReport.insights.workload_trend.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                <div className="mb-6">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2"><FiLayers className="text-emerald-500" /> Daily Workload (Received vs Reviewed)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Tasks pushed to review vs tasks completed/rejected.</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reviewerReport.insights.workload_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold', color: '#1e293b' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 15 }} />
                      <Bar dataKey="received" name="Tasks Received" fill="#cbd5e1" radius={[4, 4, 4, 4]} barSize={16} />
                      <Bar dataKey="reviewed" name="Tasks Reviewed" fill="#10b981" radius={[4, 4, 4, 4]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-black text-slate-800 dark:text-slate-100">Detailed Review Log (Microscope)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6">Task Title</th>
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Submitted At</th>
                    <th className="py-4 px-6">Reviewed At</th>
                    <th className="py-4 px-6">Turnaround Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {reviewerReport.history && reviewerReport.history.length > 0 ? (
                    reviewerReport.history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 w-1/3">
                          {row.title}
                          {row.priority && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 dark:text-slate-500">{row.priority}</span>}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">{row.staff_name}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                            }`}>
                            {row.status === 'Completed' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                          {row.submitted_at ? new Date(row.submitted_at.replace(' ', 'T') + 'Z').toLocaleString('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-'}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                          {row.reviewed_at ? new Date(row.reviewed_at.replace(' ', 'T') + 'Z').toLocaleString('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-'}
                        </td>
                        <td className="py-4 px-6 font-black text-slate-800 dark:text-slate-100">{row.review_time || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold italic">No review history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerReport;
