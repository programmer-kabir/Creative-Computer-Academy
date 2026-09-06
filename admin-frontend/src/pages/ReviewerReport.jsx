import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  FiChevronDown,
  FiCalendar,
  FiTrendingUp,
  FiFilter,
  FiSearch,
  FiX,
  FiShoppingCart,
  FiGlobe,
  FiExternalLink,
  FiGrid,
  FiList,
  FiEye,
  FiFileText,
  FiCheck,
  FiArrowRight,
  FiTag
} from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

// Custom Searchable Stylish Dropdown Component
const ReviewerSearchSelect = ({ value, onChange, options, apiBase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(opt =>
      (opt.name && opt.name.toLowerCase().includes(q)) ||
      (opt.designation && opt.designation.toLowerCase().includes(q)) ||
      (opt.department_name && opt.department_name.toLowerCase().includes(q)) ||
      (opt.label && opt.label.toLowerCase().includes(q))
    );
  }, [options, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border transition-all rounded-2xl h-11 px-3 outline-none text-left shadow-xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-50/40 dark:bg-slate-800'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.profile_picture ? (
            <img
              src={`${apiBase}${selectedOption.profile_picture}`}
              alt={selectedOption.name}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-[11px] uppercase flex-shrink-0">
              {selectedOption?.name ? selectedOption.name.charAt(0) : 'R'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
              {selectedOption?.name || 'Select Reviewer'}
            </p>
            {selectedOption?.designation && (
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate -mt-0.5">
                {selectedOption.designation}
              </p>
            )}
          </div>
        </div>
        <FiChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reviewer..."
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No reviewers found
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-2 ${
                      String(value) === String(opt.value)
                        ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-950/40 font-bold'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.profile_picture ? (
                        <img
                          src={`${apiBase}${opt.profile_picture}`}
                          alt={opt.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase flex-shrink-0">
                          {opt.name ? opt.name.charAt(0) : 'R'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{opt.name}</p>
                        {opt.designation && (
                          <p className="text-[10px] text-slate-400 truncate font-normal">
                            {opt.designation} {opt.department_name ? `• ${opt.department_name}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {String(value) === String(opt.value) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
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

  // ── Main Page Tabs: Review Analytics vs Marketplace Uploads ──
  const [activeMainTab, setActiveMainTab] = useState('analytics'); // 'analytics' | 'marketplaces'

  // ── Date Filters State ──
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [customStart, setCustomStart] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState(now.toISOString().split('T')[0]);

  // ── Marketplace Tab Local Search & Filters ──
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketStatusFilter, setMarketStatusFilter] = useState('all');
  const [marketPlatformFilter, setMarketPlatformFilter] = useState('all');
  const [marketViewMode, setMarketViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedMarketModal, setSelectedMarketModal] = useState(null);

  // Memoized Reviewer Options
  const reviewerOptions = useMemo(() => {
    return staffList.map(staff => ({
      value: String(staff.id),
      label: `${staff.name} (${staff.designation || 'Reviewer'})`,
      name: staff.name,
      designation: staff.designation,
      department_name: staff.department_name,
      profile_picture: staff.profile_picture
    }));
  }, [staffList]);

  // Active Date Range Computation
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
        start: '2023-01-01',
        end: todayStr,
        label: 'All-Time Cumulative'
      };
    }

    return {
      start: customStart,
      end: customEnd,
      label: `Custom (${customStart} to ${customEnd})`
    };
  }, [filterType, selectedYear, selectedMonth, customStart, customEnd]);

  useEffect(() => {
    setStartDate(activeDateRange.start);
    setEndDate(activeDateRange.end);
  }, [activeDateRange]);

  // 1. Fetch Reviewers List
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/admin/reviewer/get_all_reviewers.php`);
        if (res.data.status === 'success') {
          setStaffList(res.data.data);
          const reviewers = res.data.data;
          if (reviewers.length > 0 && !selectedStaffId) {
            setSelectedStaffId(String(reviewers[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff list', err);
      }
    };
    fetchStaff();
  }, []);

  // 2. Fetch Reviewer Report Analytics
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
    if (selectedStaffId && startDate && endDate) {
      fetchReport();
    }
  }, [selectedStaffId, startDate, endDate]);

  // Lock background scroll when details modal is open
  useEffect(() => {
    if (selectedMarketModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMarketModal]);

  // Filtered Marketplace List
  const filteredMarketplaces = useMemo(() => {
    if (!reviewerReport || !reviewerReport.marketplaces) return [];
    return reviewerReport.marketplaces.filter(item => {
      const q = marketSearchQuery.toLowerCase().trim();
      const marketName = item.marketplace === 'Custom' ? (item.custom_market || 'Custom') : item.marketplace;
      const matchesSearch = !q ||
        (item.task_title && item.task_title.toLowerCase().includes(q)) ||
        (item.staff_name && item.staff_name.toLowerCase().includes(q)) ||
        (marketName && marketName.toLowerCase().includes(q)) ||
        (item.approval_url && item.approval_url.toLowerCase().includes(q));

      const statusLower = (item.status || 'pending').toLowerCase();
      const matchesStatus = marketStatusFilter === 'all' ||
        (marketStatusFilter === 'live' ? ['live', 'approved'].includes(statusLower) :
         marketStatusFilter === 'review' ? ['under review', 'submitted', 'uploaded', 'pending', 'in review'].includes(statusLower) :
         marketStatusFilter === 'rejected' ? statusLower === 'rejected' :
         statusLower === marketStatusFilter.toLowerCase());

      const matchesPlatform = marketPlatformFilter === 'all' ||
        (item.marketplace === marketPlatformFilter || item.custom_market === marketPlatformFilter);

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [reviewerReport, marketSearchQuery, marketStatusFilter, marketPlatformFilter]);

  // Export CSV
  const handleExport = () => {
    if (!reviewerReport) return;

    const selectedStaffInfo = staffList.find(s => String(s.id) === String(selectedStaffId)) || { name: 'Reviewer' };

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

    if (activeMainTab === 'marketplaces' && reviewerReport.marketplaces && reviewerReport.marketplaces.length > 0) {
      const headers = ['Task Title', 'Designer / Staff', 'Marketplace', 'Status', 'Submitted Date', 'Approved / Live Link', 'Deliverable Link'];
      const rows = reviewerReport.marketplaces.map(m => [
        `"${m.task_title || '-'}"`,
        `"${m.staff_name || '-'}"`,
        `"${m.marketplace === 'Custom' ? (m.custom_market || 'Custom') : m.marketplace}"`,
        `"${m.status || 'Pending'}"`,
        `"${m.submitted_date || m.created_at || '-'}"`,
        `"${m.approval_url || '-'}"`,
        `"${m.submission_link || '-'}"`
      ]);
      downloadCSV(`${selectedStaffInfo.name}_marketplace_distributions_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
    } else if (reviewerReport.history && reviewerReport.history.length > 0) {
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
      downloadCSV(`${selectedStaffInfo.name}_reviewer_analytics_${startDate}_to_${endDate}.csv`, [headers, ...rows]);
    }
  };

  const selectedStaffInfo = staffList.find(s => String(s.id) === String(selectedStaffId));

  const totalReviewed = reviewerReport?.summary?.total_reviewed || 0;
  const approvedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_approved / totalReviewed) * 100) : 0;
  const rejectedRate = totalReviewed > 0 ? Math.round((reviewerReport.summary.total_rejected / totalReviewed) * 100) : 0;

  const slaTotal = (reviewerReport?.summary?.sla_met || 0) + (reviewerReport?.summary?.sla_breached || 0);
  const slaRate = slaTotal > 0 ? Math.round(((reviewerReport.summary.sla_met || 0) / slaTotal) * 100) : 100;

  const mSummary = reviewerReport?.marketplace_summary || { total_uploads: 0, live: 0, under_review: 0, rejected: 0, platforms: {} };

  return (
    <div className="pb-12 space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Reviewer Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-xs sm:text-sm">
            Analyze reviewer SLAs, turnaround times, bounce rates, and stock marketplace uploads.
          </p>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Pill Date Presets */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType('this_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'this_month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiCalendar size={13} />
              <span>This Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('last_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'last_month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiClock size={13} />
              <span>Last Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('specific_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'specific_month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiLayers size={13} />
              <span>Select Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all_time')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all_time'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiTrendingUp size={13} />
              <span>All-Time</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiFilter size={13} />
              <span>Custom Range</span>
            </button>
          </div>

          {/* Right: Reviewer Selector, Date Pill & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Reviewer Selector */}
            <div className="w-64 sm:w-72">
              <ReviewerSearchSelect
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={reviewerOptions}
                apiBase={API_BASE}
              />
            </div>

            {/* Active Date Range Pill */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-900/50 shrink-0">
              <FiCalendar size={13} />
              <span>{startDate} → {endDate}</span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Refresh Analytics"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
            </button>

            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !reviewerReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Export CSV"
            >
              <FiDownload size={13} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month/Year Sub-Bar */}
        {filterType === 'specific_month' && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i.toString()}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Custom Date Picker Sub-Bar */}
        {filterType === 'custom' && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Aggregated Totals Summary Info Bar */}
        {selectedStaffInfo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400">
                Reviewer: <strong className="text-slate-900 dark:text-white font-black">{selectedStaffInfo.name}</strong> ({selectedStaffInfo.designation || 'Reviewer'})
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Department: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedStaffInfo.department_name || 'QA / Review'}</strong>
              </span>
              {reviewerReport?.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Received: <strong className="text-slate-900 dark:text-white font-black">{reviewerReport.summary.total_received || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Reviewed: <strong className="text-blue-600 dark:text-blue-400 font-black">{reviewerReport.summary.total_reviewed || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Market Uploads: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{mSummary.total_uploads || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    SLA Met: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{slaRate}%</strong>
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 italic font-medium hidden sm:inline">
              Period: {activeDateRange.label}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 font-bold animate-in fade-in">
          <FiAlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Selected Reviewer Avatar Header Card */}
      {selectedStaffInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden flex-shrink-0">
              {selectedStaffInfo.profile_picture ? (
                <img
                  src={`${API_BASE}${selectedStaffInfo.profile_picture}`}
                  alt={selectedStaffInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{selectedStaffInfo.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-none">{selectedStaffInfo.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">
                {selectedStaffInfo.designation || 'Reviewer'} • <span className="text-blue-600 dark:text-blue-400">{selectedStaffInfo.department_name || 'QA Team'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <span className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500">
              Reviewer ID: #{selectedStaffInfo.id}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Navigation Tabs: SLA Analytics vs Marketplace Uploads ── */}
      <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-800/30">
        <button
          type="button"
          onClick={() => setActiveMainTab('analytics')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeMainTab === 'analytics' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiActivity size={16} /> 
          <span>QA & Review SLA Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('marketplaces')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeMainTab === 'marketplaces' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md shadow-slate-900/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiShoppingCart size={16} /> 
          <span>Marketplace Uploads & Distributions</span>
          {mSummary.total_uploads > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black border border-indigo-200 dark:border-indigo-800">
              {mSummary.total_uploads}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Aggregating Reviewer Analytics & Marketplace Submissions...</p>
        </div>
      ) : selectedStaffInfo && reviewerReport ? (
        <>
          {/* ═════════════════ TAB 1: QA & SLA ANALYTICS ═════════════════ */}
          {activeMainTab === 'analytics' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {(reviewerReport.summary.sla_breached > 0 || Object.keys(reviewerReport.insights?.top_friction || {}).length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {reviewerReport.summary.sla_breached > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm text-rose-500">
                        <FiAlertCircle size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-rose-800 dark:text-rose-400 uppercase tracking-wider text-xs">SLA Breach Alert</h4>
                        <p className="text-sm text-rose-700 dark:text-rose-300 mt-1 font-medium">This reviewer has <b>{reviewerReport.summary.sla_breached} tasks</b> that took longer than 24 hours to review.</p>
                      </div>
                    </div>
                  )}
                  {Object.keys(reviewerReport.insights?.top_friction || {}).length > 0 && (
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><FiLayers /> Total Received</p>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.summary.total_received}</h3>
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
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{reviewerReport.insights?.avg_iterations || 0}x</h3>
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
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily average turnaround time (in hours).</p>
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
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tasks pushed to review vs tasks completed/rejected.</p>
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

              {/* Microscope Detailed Log Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 dark:text-slate-100">Detailed Review Log (Microscope)</h3>
                  <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
                    {reviewerReport.history?.length || 0} reviews
                  </span>
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
                              {row.priority && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">{row.priority}</span>}
                            </td>
                            <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-300">{row.staff_name}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                row.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                              }`}>
                                {row.status === 'Completed' ? 'Approved' : 'Rejected'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
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

          {/* ═════════════════ TAB 2: MARKETPLACE UPLOADS & TRACKING ═════════════════ */}
          {activeMainTab === 'marketplaces' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {/* Marketplace Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Market Uploads</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">{mSummary.total_uploads}</h3>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiShoppingCart size={20} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                  <div>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Live / Approved</p>
                    <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{mSummary.live}</h3>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle size={20} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                  <div>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Under Review / Queue</p>
                    <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{mSummary.under_review}</h3>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiClock size={20} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                  <div>
                    <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Rejected / Fix Needed</p>
                    <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{mSummary.rejected}</h3>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiXCircle size={20} />
                  </div>
                </div>
              </div>

              {/* Platform Distribution Chips */}
              {Object.keys(mSummary.platforms || {}).length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                    <FiGlobe size={13} className="text-blue-500" /> Platform Split:
                  </span>
                  {Object.entries(mSummary.platforms).map(([platform, count]) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setMarketPlatformFilter(marketPlatformFilter === platform ? 'all' : platform)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                        marketPlatformFilter === platform
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <span>{platform}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        marketPlatformFilter === platform ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                  {marketPlatformFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setMarketPlatformFilter('all')}
                      className="text-xs font-bold text-rose-500 hover:underline ml-2"
                    >
                      Clear Platform Filter
                    </button>
                  )}
                </div>
              )}

              {/* Filter Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Uploaded Files & Distribution Track</span>
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                      {filteredMarketplaces.length} items
                    </span>
                  </h3>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'live', label: 'Live / Approved' },
                      { id: 'review', label: 'Under Review' },
                      { id: 'rejected', label: 'Rejected' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMarketStatusFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                          marketStatusFilter === tab.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Controls: Search & Switcher */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-56">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={marketSearchQuery}
                      onChange={(e) => setMarketSearchQuery(e.target.value)}
                      placeholder="Search task or designer..."
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    {marketSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMarketSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        <FiX size={13} />
                      </button>
                    )}
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                    <button
                      type="button"
                      onClick={() => setMarketViewMode('cards')}
                      title="Cards View"
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        marketViewMode === 'cards'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <FiGrid size={14} />
                      <span className="hidden sm:inline text-[11px]">Cards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarketViewMode('table')}
                      title="Table View"
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        marketViewMode === 'table'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <FiList size={14} />
                      <span className="hidden sm:inline text-[11px]">Table</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: CARDS MODE */}
              {marketViewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMarketplaces && filteredMarketplaces.length > 0 ? (
                    filteredMarketplaces.map((m, idx) => {
                      const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom Market') : m.marketplace;
                      const isLive = ['live', 'approved'].includes((m.status || '').toLowerCase());
                      const isRejected = (m.status || '').toLowerCase() === 'rejected';

                      return (
                        <div
                          key={m.id || idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-indigo-400/80 transition-all flex flex-col justify-between group space-y-3"
                        >
                          <div className="space-y-2.5">
                            {/* Card Header: Marketplace Name + Status */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-100 dark:border-indigo-900/50">
                                  <FiShoppingCart size={13} />
                                </div>
                                <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                                  {marketName}
                                </span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                                isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                                'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              }`}>
                                {m.status || 'Pending'}
                              </span>
                            </div>

                            {/* Task Title & Category */}
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                {m.task_category || 'General Graphic'} • Task #{m.task_id}
                              </p>
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mt-0.5">
                                {m.task_title}
                              </h4>
                            </div>

                            {/* Designer Info */}
                            <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 flex-shrink-0">
                                {m.staff_name ? m.staff_name.charAt(0) : 'S'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                  {m.staff_name || 'Staff Member'}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {m.staff_designation || 'Designer'}
                                </p>
                              </div>
                            </div>

                            {/* Upload Date & Reviewer Info */}
                            <div className="text-[11px] text-slate-400 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Uploaded Date:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {m.submitted_date ? new Date(m.submitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              {m.added_by_name && (
                                <div className="flex justify-between">
                                  <span>Pushed By:</span>
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">{m.added_by_name} ({m.added_by_role || 'Reviewer'})</span>
                                </div>
                              )}
                            </div>

                            {/* Live Approved URL Snippet Card */}
                            {m.approval_url && (
                              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                                    Live Approved Link:
                                  </span>
                                  <a
                                    href={m.approval_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline truncate block"
                                  >
                                    {m.approval_url}
                                  </a>
                                </div>
                                <a
                                  href={m.approval_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0 shadow-xs"
                                  title="Open Live Marketplace URL"
                                >
                                  <FiExternalLink size={13} />
                                </a>
                              </div>
                            )}

                            {/* Rejection Reason Notice */}
                            {m.reject_reason && isRejected && (
                              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300">
                                <span className="font-black uppercase tracking-wider text-[10px] block text-rose-800 dark:text-rose-400">Rejection Reason:</span>
                                <p className="mt-0.5 line-clamp-2">{m.reject_reason}</p>
                              </div>
                            )}

                            {/* Audit History Snapshot */}
                            {m.logs && m.logs.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                                <span className="font-bold text-slate-400">Status History ({m.logs.length} transitions):</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {m.logs.slice(-3).map((l, lIdx) => (
                                    <span key={lIdx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold">
                                      {l.status_to}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {m.approval_url ? (
                                <a
                                  href={m.approval_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-xs"
                                  title="Open Live Approved Marketplace Link"
                                >
                                  <FiExternalLink size={12} />
                                  <span>Live Link</span>
                                </a>
                              ) : null}

                              {m.submission_link ? (
                                <a
                                  href={m.submission_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                                  title="Open Original Deliverable File"
                                >
                                  <FiFileText size={12} />
                                  <span>Deliverable</span>
                                </a>
                              ) : null}

                              {!m.approval_url && !m.submission_link && (
                                <span className="text-xs text-slate-400 italic">No link available</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedMarketModal(m)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-bold text-xs rounded-xl transition-colors ml-auto"
                            >
                              <FiEye size={12} />
                              <span>Details & History</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-xs italic">
                      No marketplace uploads found matching your filter criteria.
                    </div>
                  )}
                </div>
              )}

              {/* View 2: DENSE TABLE MODE */}
              {marketViewMode === 'table' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Task / File Title</th>
                          <th className="py-3 px-4">Designer</th>
                          <th className="py-3 px-4">Marketplace</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Submitted Date</th>
                          <th className="py-3 px-4">Pushed By</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                        {filteredMarketplaces && filteredMarketplaces.length > 0 ? (
                          filteredMarketplaces.map((m, idx) => {
                            const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom') : m.marketplace;
                            const isLive = ['live', 'approved'].includes((m.status || '').toLowerCase());
                            const isRejected = (m.status || '').toLowerCase() === 'rejected';

                            return (
                              <tr key={m.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 max-w-xs">
                                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                    {m.task_title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {m.task_category || 'General'} • Task #{m.task_id}
                                  </p>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 flex-shrink-0">
                                      {m.staff_name ? m.staff_name.charAt(0) : 'S'}
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{m.staff_name || 'Staff'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-black text-indigo-600 dark:text-indigo-400">
                                  {marketName}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                    isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                                    isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                                    'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                  }`}>
                                    {m.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">
                                  {m.submitted_date ? new Date(m.submitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {m.added_by_name || 'Reviewer'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {m.approval_url && (
                                      <a
                                        href={m.approval_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                                        title="Open Live Approved Marketplace Link"
                                      >
                                        <FiExternalLink size={13} />
                                      </a>
                                    )}
                                    {m.submission_link && (
                                      <a
                                        href={m.submission_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
                                        title="Open Deliverable Link"
                                      >
                                        <FiFileText size={13} />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedMarketModal(m)}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-bold rounded-lg transition-colors"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="py-10 text-center text-slate-400 font-bold italic">
                              No marketplace submissions found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MARKETPLACE DETAILS MODAL VIA PORTAL */}
              {selectedMarketModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center border border-indigo-100">
                          <FiShoppingCart size={18} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                            {selectedMarketModal.marketplace === 'Custom' ? (selectedMarketModal.custom_market || 'Custom Market') : selectedMarketModal.marketplace} Submission
                          </h3>
                          <p className="text-xs text-slate-400 font-bold">
                            Task #{selectedMarketModal.task_id} • {selectedMarketModal.task_title}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMarketModal(null)}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 min-h-0">
                      {/* Status & Basic Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
                          <p className="text-xs font-black text-indigo-600 mt-1 uppercase">{selectedMarketModal.status || 'Pending'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Designer / Staff</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 truncate">{selectedMarketModal.staff_name || 'Staff'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted Date</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">
                            {selectedMarketModal.submitted_date ? new Date(selectedMarketModal.submitted_date).toLocaleDateString('en-GB') : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Approved Live Link */}
                      {selectedMarketModal.approval_url && (
                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live Approved Marketplace URL</p>
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1 select-all">{selectedMarketModal.approval_url}</p>
                          </div>
                          <a
                            href={selectedMarketModal.approval_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            <FiExternalLink size={13} />
                            <span>Open Live</span>
                          </a>
                        </div>
                      )}

                      {/* File Link */}
                      {selectedMarketModal.submission_link && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Deliverable Asset / Drive Link</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5 select-all">{selectedMarketModal.submission_link}</p>
                          </div>
                          <a
                            href={selectedMarketModal.submission_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <FiExternalLink size={13} />
                            <span>Open Asset</span>
                          </a>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {selectedMarketModal.reject_reason && (
                        <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1">
                          <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase">Rejection / Revision Reason</p>
                          <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">{selectedMarketModal.reject_reason}</p>
                        </div>
                      )}

                      {/* Full Status Transition History Log */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <FiActivity size={13} className="text-indigo-500" />
                          <span>Status Lifecycle Audit History</span>
                        </h4>

                        {selectedMarketModal.logs && selectedMarketModal.logs.length > 0 ? (
                          <div className="space-y-2 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-6">
                            {selectedMarketModal.logs.map((log, lIdx) => (
                              <div key={lIdx} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                                <span className="absolute -left-6 top-4 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900"></span>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {log.status_from ? `${log.status_from} → ` : ''} <span className="text-indigo-600">{log.status_to}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(log.created_at).toLocaleString('en-GB')}
                                  </span>
                                </div>
                                {log.changed_by_name && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Updated by <strong>{log.changed_by_name}</strong> ({log.changed_by_role || 'Reviewer'})
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-slate-400 italic">
                            Initial submission created on {new Date(selectedMarketModal.created_at).toLocaleDateString('en-GB')}. No subsequent revisions recorded.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMarketModal(null)}
                        className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 transition-colors text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ReviewerReport;
