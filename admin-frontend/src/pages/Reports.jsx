import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle, 
  FiRefreshCw, 
  FiFileText, 
  FiDownload, 
  FiUser, 
  FiTrendingUp,
  FiUserCheck,
  FiChevronDown,
  FiCheck,
  FiPrinter,
  FiLink,
  FiFilter,
  FiLayers,
  FiStar,
  FiSearch,
  FiGrid,
  FiList,
  FiEye,
  FiExternalLink,
  FiX,
  FiActivity,
  FiFile,
  FiImage,
  FiFolder,
  FiMessageSquare,
  FiCopy,
  FiCheckSquare,
  FiInfo,
  FiTag,
  FiShoppingCart,
  FiGlobe,
  FiZap,
  FiTarget,
  FiFlag
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import AgenticBlueprintViewer from '../components/AgenticBlueprintViewer';
import { DescriptionRenderer } from '../components/TaskOversight/TaskDescriptionRenderer';
import { ImageLightbox } from '../components/TaskOversight/ImageLightbox';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

// Custom Searchable Stylish Dropdown Component
const StaffSearchSelect = ({ value, onChange, options, apiBase }) => {
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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.profile_picture ? (
            <img
              src={`${apiBase}${selectedOption.profile_picture}`}
              alt={selectedOption.name}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] uppercase flex-shrink-0">
              {selectedOption?.name ? selectedOption.name.charAt(0) : 'S'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {selectedOption?.name || 'Select Staff'}
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
                  placeholder="Search staff filter..."
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No staff found
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
                          {opt.name ? opt.name.charAt(0) : 'S'}
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
                      <FiCheck className="text-blue-600 flex-shrink-0 ml-1.5" size={15} />
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

const Reports = () => {
  // Staff listing
  const [staffList, setStaffList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const staffParam = searchParams.get('staff');
  const tabParam = searchParams.get('tab') || 'attendance';
  
  const [selectedStaffId, setSelectedStaffId] = useState(staffParam || '');
  const [activeTab, setActiveTab] = useState(tabParam);

  // Modern Filter State
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month'); // 'this_month' | 'last_month' | 'specific_month' | 'all_time' | 'custom'
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [attReport, setAttReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [error, setError] = useState('');

  // Task View Mode & Filter State
  const [taskViewMode, setTaskViewMode] = useState('cards'); // 'cards' | 'table'
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'deliverables' | 'marketplaces' | 'review'
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Helper to extract clean concise snippet from description/JSON
  const getCleanTaskSnippet = (desc) => {
    if (!desc) return 'No description provided.';
    if (typeof desc === 'string' && (desc.trim().startsWith('{') || desc.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(desc);
        if (parsed.canvas_specifications?.format) {
          return `Format: ${parsed.canvas_specifications.format}${parsed.canvas_specifications.color_mode ? ` • ${parsed.canvas_specifications.color_mode}` : ''}`;
        }
        if (parsed.brand_name) {
          return `Brand: ${parsed.brand_name}`;
        }
        if (parsed.task_name || parsed.title) {
          return parsed.task_name || parsed.title;
        }
        return 'Structured Technical Specifications';
      } catch {
        // fallback
      }
    }
    const stripped = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return stripped.length > 95 ? stripped.substring(0, 95) + '...' : (stripped || 'No description provided.');
  };

  // Helper to safely parse task specifications object
  const parseTaskSpecs = (desc) => {
    if (!desc || typeof desc !== 'string') return null;
    const trimmed = desc.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  // Helper to format date & time nicely in Asia/Dhaka or locale
  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    let s = String(dateStr).trim();
    // If it's a date-only string like YYYY-MM-DD, default the time to 09:00:00 AM (work start)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      s = `${s} 09:00:00`;
    }
    const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
    if (isNaN(d.getTime())) {
      const fallbackD = new Date(s);
      if (isNaN(fallbackD.getTime())) return dateStr;
      return fallbackD.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to format duration in seconds into friendly string
  const formatDurationSeconds = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return null;
    const sec = Math.max(0, Math.round(totalSeconds));
    if (sec < 60) return `${sec}s`;
    const minutes = Math.floor(sec / 60);
    if (minutes < 60) {
      const remainingSec = sec % 60;
      return remainingSec > 0 ? `${minutes}m ${remainingSec}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    if (hours < 24) {
      return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Helper to compute duration between two timestamps
  const formatDurationBetween = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return null;
    let sStr = String(startDateStr).trim();
    let eStr = String(endDateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(sStr)) sStr = `${sStr} 09:00:00`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(eStr)) eStr = `${eStr} 09:00:00`;

    const s = new Date(sStr.includes('T') ? sStr : sStr.replace(' ', 'T')).getTime();
    const e = new Date(eStr.includes('T') ? eStr : eStr.replace(' ', 'T')).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return null;
    return formatDurationSeconds((e - s) / 1000);
  };

  // Memoized Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (!taskReport?.tasks) return [];
    return taskReport.tasks.filter((task) => {
      const q = taskSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (task.title && task.title.toLowerCase().includes(q)) ||
        (task.category && task.category.toLowerCase().includes(q));

      const matchesStatus = taskStatusFilter === 'all' ||
        (taskStatusFilter === 'delayed' ? task.was_delayed :
         taskStatusFilter === 'resubmitted' ? task.was_resubmitted :
         taskStatusFilter === 'has_link' ? Boolean(task.submission_link) :
         task.status?.toLowerCase() === taskStatusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [taskReport, taskSearchQuery, taskStatusFilter]);

  // Dropdown Memoized Options (Individual Staff Only)
  const employeeOptions = useMemo(() => {
    return staffList.map(staff => ({
      value: String(staff.id),
      label: `${staff.name} (${staff.designation || 'Staff'})`,
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

  // 1. Fetch Staff List
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/admin/staff/get_all_staff.php`);
        if (res.data.status === 'success') {
          setStaffList(res.data.data);
          if (res.data.data.length > 0 && (!selectedStaffId || selectedStaffId === 'all')) {
            setSelectedStaffId(String(res.data.data[0].id));
          }
        } else {
          setError(res.data.message || 'Failed to load staff list.');
        }
      } catch (err) {
        console.error(err);
        setError('Error connecting to backend API.');
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    const staff = searchParams.get('staff');
    if (staff && staff !== 'all' && staff !== selectedStaffId) {
      setSelectedStaffId(staff);
    }
  }, [searchParams]);

  // Selected Employee Info Helper
  const selectedStaffInfo = useMemo(() => {
    if (!selectedStaffId) return null;
    return staffList.find(s => String(s.id) === String(selectedStaffId)) || null;
  }, [staffList, selectedStaffId]);

  // 2. Fetch Reports Data
  const fetchReports = async () => {
    if (!selectedStaffId || !startDate || !endDate) return;
    setLoading(true);
    setError('');

    try {
      const [attRes, taskRes] = await Promise.all([
        axios.post(`${API_BASE}api/reports/get_attendance_report.php`, {
          user_id: selectedStaffId,
          start_date: startDate,
          end_date: endDate
        }),
        axios.post(`${API_BASE}api/reports/get_task_report.php`, {
          user_id: selectedStaffId,
          start_date: startDate,
          end_date: endDate
        })
      ]);

      if (attRes.data.status === 'success') {
        const data = attRes.data;

        let totalExpectedSeconds = 0;
        let totalWorkedSeconds = 0;
        let absentDays = 0;

        if (data.history && Array.isArray(data.history)) {
          data.history.forEach((day) => {
            if (day.expected_hours) {
              const expMatch = day.expected_hours.match(/(\d+)h\s*(\d+)m/);
              if (expMatch) {
                totalExpectedSeconds += (parseInt(expMatch[1], 10) * 3600) + (parseInt(expMatch[2], 10) * 60);
              }
            }
            if (day.total_hours) {
              const wrkMatch = day.total_hours.match(/(\d+)h\s*(\d+)m/);
              if (wrkMatch) {
                totalWorkedSeconds += (parseInt(wrkMatch[1], 10) * 3600) + (parseInt(wrkMatch[2], 10) * 60);
              }
            }
            const isAbsentStatus = day.status && day.status.toLowerCase() === 'absent';
            if (isAbsentStatus && !day.is_weekend && !day.is_holiday) {
              absentDays++;
            }
          });
        }

        const formatSecs = (totalSecs) => {
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);
          return `${h}h ${m}m`;
        };

        if (!data.summary.total_expected) data.summary.total_expected = formatSecs(totalExpectedSeconds);
        if (!data.summary.total_worked) data.summary.total_worked = formatSecs(totalWorkedSeconds);
        if (!data.summary.absent || data.summary.absent === 0) data.summary.absent = absentDays;

        setAttReport(data);
      } else {
        setAttReport(null);
      }

      if (taskRes.data.status === 'success') {
        setTaskReport(taskRes.data);
      } else {
        setTaskReport(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports. Please verify your backend server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      fetchReports();
    }
  }, [selectedStaffId, startDate, endDate]);

  // ─── Export to Excel (.xls) ────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!selectedStaffInfo) return;
    const filename = `${selectedStaffInfo.name.replace(/\s+/g, '_')}_Performance_Report_${startDate}_to_${endDate}.xls`;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .header-title { font-size: 16pt; font-weight: bold; color: #1e3a8a; }
          .main-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          .main-th { background-color: #1e293b; color: #ffffff; padding: 8px 12px; font-weight: bold; border: 1px solid #334155; }
          .main-td { padding: 8px 12px; border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <p class="header-title">Staff Performance Report: ${selectedStaffInfo.name} (${selectedStaffInfo.designation || 'Employee'})</p>
        <p><strong>Department:</strong> ${selectedStaffInfo.department_name || 'N/A'} | <strong>Period:</strong> ${startDate} to ${endDate}</p>
        <br />

        <h3>1. Attendance Record</h3>
        <table class="main-table">
          <thead>
            <tr>
              <th class="main-th">Date</th>
              <th class="main-th">Status</th>
              <th class="main-th">Check In</th>
              <th class="main-th">Check Out</th>
              <th class="main-th">Working Hours</th>
              <th class="main-th">Break Minutes</th>
              <th class="main-th">Overtime/Short</th>
            </tr>
          </thead>
          <tbody>
            ${(attReport?.history || []).map(r => `
              <tr>
                <td class="main-td">${r.date}</td>
                <td class="main-td">${r.status}</td>
                <td class="main-td">${r.check_in || '-'}</td>
                <td class="main-td">${r.check_out || '-'}</td>
                <td class="main-td">${r.total_hours || '-'}</td>
                <td class="main-td">${r.total_break_minutes || 0}m</td>
                <td class="main-td">${r.overtime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>2. Task Deliverables Record</h3>
        <table class="main-table">
          <thead>
            <tr>
              <th class="main-th">Title</th>
              <th class="main-th">Status</th>
              <th class="main-th">Category</th>
              <th class="main-th">Assign Date</th>
              <th class="main-th">Submission Link</th>
              <th class="main-th">Delayed</th>
              <th class="main-th">Resubmissions</th>
            </tr>
          </thead>
          <tbody>
            ${(taskReport?.tasks || []).map(t => `
              <tr>
                <td class="main-td"><strong>${t.title}</strong></td>
                <td class="main-td">${t.status}</td>
                <td class="main-td">${t.category || 'General'}</td>
                <td class="main-td">${t.assign_date || t.created_at}</td>
                <td class="main-td">${t.submission_link || '-'}</td>
                <td class="main-td">${t.was_delayed ? 'Yes' : 'No'}</td>
                <td class="main-td">${t.resubmit_count || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── Export to CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!selectedStaffInfo) return;
    if (activeTab === 'attendance') {
      if (!attReport || !attReport.history || attReport.history.length === 0) return;
      const headers = ['Date', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Break Time', 'Overtime/Short'];
      const rows = attReport.history.map(row => [
        row.date,
        row.status,
        row.check_in || '-',
        row.check_out || '-',
        row.total_hours || '-',
        row.total_break_minutes ? `${row.total_break_minutes}m` : '-',
        row.overtime || '-'
      ]);
      downloadCSV(`${selectedStaffInfo.name}_attendance_report.csv`, [headers, ...rows]);
    } else if (activeTab === 'tasks') {
      if (!taskReport || !taskReport.tasks || taskReport.tasks.length === 0) return;
      const headers = ['Title', 'Status', 'Category', 'Assign Date', 'Submission Link', 'Delayed', 'Resubmitted', 'Rejection Reason'];
      const rows = taskReport.tasks.map(t => [
        t.title,
        t.status,
        t.category || '-',
        t.assign_date || t.created_at,
        t.submission_link || '-',
        t.was_delayed ? 'Yes' : 'No',
        t.was_resubmitted ? 'Yes' : 'No',
        t.admin_note || '-'
      ]);
      downloadCSV(`${selectedStaffInfo.name}_task_report.csv`, [headers, ...rows]);
    }
  };

  const downloadCSV = (filename, contentArray) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + contentArray.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Export to PDF (Direct Styled Document) ────────────────────────────────
  const handleExportPDF = () => {
    if (!selectedStaffInfo) return;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCA Staff Report - ${selectedStaffInfo.name} (${startDate} to ${endDate})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
          }
          .staff-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
          }
          .sec-title {
            font-size: 13px;
            font-weight: 800;
            color: #1e293b;
            margin: 14px 0 8px 0;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 16px;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #334155;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-center { text-align: center; }
          .badge-p { background: #dcfce7; color: #166534; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
          .badge-l { background: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
          .badge-a { background: #fee2e2; color: #991b1b; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Creative Computer Academy</h1>
            <p style="margin:4px 0 0 0; color:#64748b; font-size:11px;">Individual Staff Performance & Attendance Report</p>
          </div>
          <div style="text-align:right; font-size:11px; color:#475569;">
            <p style="margin:0;"><strong>Period:</strong> ${startDate} to ${endDate}</p>
            <p style="margin:3px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
          </div>
        </div>

        <div class="staff-card">
          <div>
            <h2 style="margin:0; font-size:15px; color:#0f172a;">${selectedStaffInfo.name}</h2>
            <p style="margin:3px 0 0 0; font-size:11px; color:#64748b;">${selectedStaffInfo.designation || 'Staff'} • <strong>${selectedStaffInfo.department_name || 'N/A'}</strong></p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0; font-size:11px;"><strong>Duty Expected:</strong> ${attReport?.summary?.total_expected || '-'}</p>
            <p style="margin:3px 0 0 0; font-size:11px;"><strong>Hours Worked:</strong> ${attReport?.summary?.total_worked || '-'}</p>
          </div>
        </div>

        <div class="sec-title">1. Daily Attendance Record</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Break</th>
              <th>Overtime / Short</th>
            </tr>
          </thead>
          <tbody>
            ${(attReport?.history || []).map(r => `
              <tr>
                <td><strong>${new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></td>
                <td><span class="${r.status === 'Present' ? 'badge-p' : r.status === 'Late' ? 'badge-l' : 'badge-a'}">${r.status}</span></td>
                <td>${r.check_in || '-'}</td>
                <td>${r.check_out || '-'}</td>
                <td>${r.total_hours || '-'}</td>
                <td>${r.total_break_minutes > 0 ? r.total_break_minutes + 'm' : '-'}</td>
                <td>${r.overtime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sec-title">2. Task Deliverables Record</div>
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assign Date</th>
              <th>Submission</th>
              <th>Delayed</th>
            </tr>
          </thead>
          <tbody>
            ${(taskReport?.tasks || []).map(t => `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td>${t.category || 'General'}</td>
                <td>${t.status}</td>
                <td>${new Date(t.assign_date || t.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short' })}</td>
                <td>${t.submission_link ? 'Submitted' : '-'}</td>
                <td>${t.was_delayed ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      
      {/* ──────── Header Title ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Staff Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Analyze individual employee attendance logs, task deliverables, and work duration.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={loading || !selectedStaffInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Download formatted Excel Spreadsheet"
          >
            <FiDownload size={15} />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || !selectedStaffInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Export as PDF Document"
          >
            <FiPrinter size={15} />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* ──────── Control Panel: Modern Filter Bar ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
        
        {/* Top Filter Bar */}
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

          {/* Center/Right: Employee Selector, Date Badge & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Employee Selector */}
            <div className="w-64 sm:w-72">
              <StaffSearchSelect
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={employeeOptions}
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
              onClick={fetchReports}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Refresh Data"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
            </button>

            {/* CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={loading || !selectedStaffInfo}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Export CSV"
            >
              <FiDownload size={13} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month/Year Dropdown Sub-Bar */}
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

        {/* Aggregated Totals Summary Bar */}
        {selectedStaffInfo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400">Staff: <strong className="text-slate-900 dark:text-white font-black">{selectedStaffInfo.name}</strong> ({selectedStaffInfo.designation})</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">Department: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedStaffInfo.department_name || 'General'}</strong></span>
              {attReport && attReport.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Working Days: <strong className="text-slate-900 dark:text-white font-black">{attReport.summary.total_days || 0}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Present: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{attReport.summary.present || 0}</strong></span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Absent: <strong className="text-rose-600 dark:text-rose-400 font-black">{attReport.summary.absent || 0}</strong></span>
                </>
              )}
              {taskReport && taskReport.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">Tasks: <strong className="text-purple-600 dark:text-purple-400 font-black">{taskReport.summary.completed || 0} / {taskReport.summary.total_tasks || 0}</strong></span>
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
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-2 mb-8">
          <FiAlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Employee Badge */}
      {selectedStaffInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
                {selectedStaffInfo.designation || 'Employee'} • <span className="text-blue-600 dark:text-blue-400">{selectedStaffInfo.department_name || 'N/A'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <span className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500">
              ID: #{selectedStaffInfo.id}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-8 border border-slate-200 dark:border-slate-800/30">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === 'attendance' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiClock size={16} /> 
          <span>Attendance Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold transition-all ${
            activeTab === 'tasks' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md shadow-slate-900/5' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          <FiFileText size={16} /> 
          <span>Task Deliverables</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Aggregating Report Analytics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {attReport ? (
                <>
                  {/* Attendance Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Working Days</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{attReport.summary.total_days}</h3>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiCalendar size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                      <div>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Present Days</p>
                        <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{attReport.summary.present}</h3>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiCheckCircle size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <div>
                        <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Absent Days</p>
                        <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{attReport.summary.absent}</h3>
                      </div>
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiXCircle size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                      <div>
                        <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Late Entries</p>
                        <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{attReport.summary.late}</h3>
                      </div>
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiClock size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-violet-500"></div>
                      <div>
                        <p className="text-xs font-black text-violet-600 uppercase tracking-wider mb-1">Expected Duty</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_expected}</h3>
                      </div>
                      <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/40 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiClock size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                      <div>
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Hours Worked</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_worked}</h3>
                      </div>
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiUserCheck size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
                      <div>
                        <p className="text-xs font-black text-teal-600 uppercase tracking-wider mb-1">Overtime</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_overtime}</h3>
                      </div>
                      <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiTrendingUp size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <div>
                        <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Short Time</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_short_time}</h3>
                      </div>
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAlertCircle size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                      <h3 className="font-black text-slate-800 dark:text-slate-100">Daily Attendance Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Check In</th>
                            <th className="py-4 px-6">Check Out</th>
                            <th className="py-4 px-6">Working Hours</th>
                            <th className="py-4 px-6">Break Time</th>
                            <th className="py-4 px-6">Overtime/Short</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                          {attReport.history && attReport.history.length > 0 ? (
                            attReport.history.map((row, index) => (
                              <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100">
                                  {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    row.status === 'Present' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                    row.status === 'Late'    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                    row.status === 'Absent'  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400' :
                                    row.status === 'Weekend' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400' :
                                    'bg-slate-50 dark:bg-slate-800/50 border-slate-150 text-slate-500'
                                  }`}>
                                    {row.status === 'Present' && <FiCheckCircle />}
                                    {row.status === 'Late' && <FiAlertCircle />}
                                    {row.status === 'Absent' && <FiXCircle />}
                                    <span>{row.status}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{row.check_in || '-'}</td>
                                <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{row.check_out || '-'}</td>
                                <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{row.total_hours || '-'}</td>
                                <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{row.total_break_minutes > 0 ? `${row.total_break_minutes}m` : '-'}</td>
                                <td className="py-4 px-6">
                                  {row.overtime ? (
                                    <span className={`font-black ${row.overtime.startsWith('+') ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}`}>
                                      {row.overtime}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="py-12 text-center text-slate-400 font-bold italic">
                                No attendance records found for this range.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
                  Select an employee and period to load attendance logs.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {taskReport ? (
                <>
                  {/* Task Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Assigned</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">{taskReport.summary.total_assigned}</h3>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiFileText size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                      <div>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                        <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{taskReport.summary.total_completed}</h3>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiCheckCircle size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <div>
                        <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Delayed</p>
                        <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{taskReport.summary.delayed_completions}</h3>
                      </div>
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiAlertCircle size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                      <div>
                        <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">Rejected</p>
                        <h3 className="text-3xl font-black text-red-700 dark:text-red-400">{taskReport.summary.total_rejected}</h3>
                      </div>
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiXCircle size={20} />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                      <div>
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Resubmitted</p>
                        <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{taskReport.summary.total_resubmitted}</h3>
                      </div>
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FiTrendingUp size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Tasks List Section Header & Controls */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>Task Log Details</span>
                          <span className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50">
                            {filteredTasks.length} {filteredTasks.length !== (taskReport.tasks?.length || 0) ? `of ${taskReport.tasks?.length || 0}` : ''}
                          </span>
                        </h3>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                          {[
                            { id: 'all', label: 'All' },
                            { id: 'completed', label: 'Completed' },
                            { id: 'in progress', label: 'In Progress' },
                            { id: 'in review', label: 'In Review' },
                            { id: 'rejected', label: 'Rejected' },
                            { id: 'delayed', label: 'Delayed' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setTaskStatusFilter(tab.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                                taskStatusFilter === tab.id
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Controls: Search & View Mode Switcher */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-56">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                          <input
                            type="text"
                            value={taskSearchQuery}
                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                            placeholder="Filter task title..."
                            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          {taskSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setTaskSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                            >
                              <FiX size={13} />
                            </button>
                          )}
                        </div>

                        {/* View Switcher: Compact Cards vs Table */}
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          <button
                            type="button"
                            onClick={() => setTaskViewMode('cards')}
                            title="Compact Cards View"
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              taskViewMode === 'cards'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <FiGrid size={14} />
                            <span className="hidden sm:inline text-[11px]">Cards</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskViewMode('table')}
                            title="Dense Table View"
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              taskViewMode === 'table'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <FiList size={14} />
                            <span className="hidden sm:inline text-[11px]">Table</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* TASKS VIEW: CARDS MODE (Basic & Compact Grid) */}
                    {taskViewMode === 'cards' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {filteredTasks && filteredTasks.length > 0 ? (
                          filteredTasks.map((task) => (
                            <div 
                              key={task.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between group"
                            >
                              <div className="space-y-2.5">
                                {/* Card Header: Status + Category + Assigned Date */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                      task.status === 'Completed'   ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                                      task.status === 'In Review'   ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                                      task.status === 'Rejected'    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                                      task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                                      'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                      {task.status || 'To-Do'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                      {task.category || 'General'}
                                    </span>
                                  </div>

                                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                                    {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                {/* Task Title */}
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {task.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                    {getCleanTaskSnippet(task.description)}
                                  </p>
                                </div>

                                {/* Flags / Tags */}
                                {(task.was_delayed || task.was_resubmitted || task.admin_note) && (
                                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    {task.was_delayed && (
                                      <span className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                                        Delayed
                                      </span>
                                    )}
                                    {task.was_resubmitted && (
                                      <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                                        Resubmitted ({task.resubmit_count}x)
                                      </span>
                                    )}
                                    {task.admin_note && (
                                      <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <FiAlertCircle size={10} /> Note
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Card Footer */}
                              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {task.submission_link ? (
                                    <a
                                      href={task.submission_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-[11px] rounded-lg transition-colors"
                                      title="Open Submission Link"
                                    >
                                      <FiLink size={11} />
                                      <span>Link</span>
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-medium">No Link</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTaskModal(task);
                                    setModalActiveTab('overview');
                                    setShowRawJson(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[11px] rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50"
                                >
                                  <FiEye size={12} />
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xs text-slate-400 font-bold text-xs italic">
                            No tasks found matching your filter.
                          </div>
                        )}
                      </div>
                    )}

                    {/* TASKS VIEW: DENSE TABLE MODE */}
                    {taskViewMode === 'table' && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="py-3 px-4 w-12 text-center">#</th>
                                <th className="py-3 px-4">Task Details</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Assigned</th>
                                <th className="py-3 px-4">Completed</th>
                                <th className="py-3 px-4">Deliverable</th>
                                <th className="py-3 px-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                              {filteredTasks && filteredTasks.length > 0 ? (
                                filteredTasks.map((task, idx) => (
                                  <tr 
                                    key={task.id} 
                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                                      {idx + 1}
                                    </td>
                                    <td className="py-3 px-4 max-w-xs">
                                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {task.title}
                                      </p>
                                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                        {getCleanTaskSnippet(task.description)}
                                      </p>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        {task.category || 'General'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                        task.status === 'Completed'   ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                                        task.status === 'In Review'   ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                                        task.status === 'Rejected'    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                                        task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                                        'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                                      }`}>
                                        {task.status || 'To-Do'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                      {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                      {task.completed_at ? (
                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                          {new Date(task.completed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {task.submission_link ? (
                                        <a
                                          href={task.submission_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[11px] rounded-lg transition-colors"
                                        >
                                          <FiLink size={11} />
                                          <span>Link</span>
                                        </a>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">-</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedTaskModal(task);
                                          setModalActiveTab('overview');
                                          setShowRawJson(false);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[11px] rounded-lg transition-colors"
                                      >
                                        <FiEye size={12} />
                                        <span>View</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="8" className="py-8 text-center text-slate-400 font-bold italic">
                                    No tasks found matching your filter.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TASK DETAILS MODAL POPUP (5-TAB RICH INTERFACE) */}
                  {selectedTaskModal && (() => {
                    const specs = parseTaskSpecs(selectedTaskModal.description);
                    const canvas = specs?.canvas_specifications || specs?.specifications || null;
                    const hasSubmissions = (selectedTaskModal.submissions && selectedTaskModal.submissions.length > 0) || Boolean(selectedTaskModal.submission_link) || Boolean(selectedTaskModal.final_delivery);
                    const hasMarketplaces = selectedTaskModal.marketplaces && selectedTaskModal.marketplaces.length > 0;
                    const hasReview = Boolean(selectedTaskModal.rating || selectedTaskModal.feedback_notes || (selectedTaskModal.tags && selectedTaskModal.tags.length > 0) || selectedTaskModal.admin_note);

                    // Parse Agentic Blueprint data
                    let blueprintObj = selectedTaskModal.blueprint_data;
                    if (typeof blueprintObj === 'string') {
                      try { blueprintObj = JSON.parse(blueprintObj); } catch { blueprintObj = null; }
                    }
                    if (!blueprintObj && specs && (specs.color_palette || specs.typography || specs.layer_tree || specs.layout_breakdown || specs.assets_links || specs.doc_format || specs.canvas_specifications)) {
                      blueprintObj = specs;
                    }

                    let variantsList = selectedTaskModal.blueprint_variants || [];
                    if (typeof variantsList === 'string') {
                      try { variantsList = JSON.parse(variantsList); } catch { variantsList = []; }
                    }

                    const isAgentic = selectedTaskModal.creation_mode === 'agentic' || Boolean(blueprintObj) || (Array.isArray(variantsList) && variantsList.length > 0);

                    // Compute accurate timestamps
                    const tAssigned = selectedTaskModal.assigned_at || selectedTaskModal.assign_date || selectedTaskModal.created_at;
                    const tInProgress = selectedTaskModal.in_progress_at || (['In Progress', 'In Review', 'Completed'].includes(selectedTaskModal.status) ? selectedTaskModal.in_progress_at : null);
                    const tSubmitted = selectedTaskModal.submitted_at || (['In Review', 'Completed'].includes(selectedTaskModal.status) ? selectedTaskModal.submitted_at : null);
                    const tCompleted = selectedTaskModal.status === 'Completed' 
                      ? (selectedTaskModal.completed_at || selectedTaskModal.updated_at || selectedTaskModal.created_at) 
                      : null;

                    // Computed Duration Strings
                    const startReactionDuration = formatDurationBetween(tAssigned, tInProgress);
                    const workDuration = selectedTaskModal.work_duration_seconds 
                      ? formatDurationSeconds(selectedTaskModal.work_duration_seconds) 
                      : formatDurationBetween(tInProgress, tSubmitted);
                    const reviewDuration = selectedTaskModal.review_duration_seconds 
                      ? formatDurationSeconds(selectedTaskModal.review_duration_seconds) 
                      : formatDurationBetween(tSubmitted, tCompleted);
                    const totalTurnaround = selectedTaskModal.total_duration_seconds 
                      ? formatDurationSeconds(selectedTaskModal.total_duration_seconds) 
                      : formatDurationBetween(tAssigned, tCompleted);

                    // Checklists & Reference Links Parser
                    let checklists = selectedTaskModal.checklists || [];
                    if (typeof checklists === 'string') {
                      try { checklists = JSON.parse(checklists); } catch { checklists = []; }
                    }

                    let refLinks = [];
                    if (selectedTaskModal.ref_links) {
                      try {
                        const parsed = JSON.parse(selectedTaskModal.ref_links);
                        refLinks = Array.isArray(parsed) ? parsed : [selectedTaskModal.ref_links];
                      } catch {
                        refLinks = [selectedTaskModal.ref_links];
                      }
                      refLinks = refLinks.filter(l => l && typeof l === 'string' && l.trim());
                    }

                    // Visual Images & Reference Images Parser
                    let visualImgs = [];
                    if (selectedTaskModal.visual_image) {
                      try {
                        const parsed = JSON.parse(selectedTaskModal.visual_image);
                        visualImgs = Array.isArray(parsed) ? parsed : [selectedTaskModal.visual_image];
                      } catch {
                        visualImgs = [selectedTaskModal.visual_image];
                      }
                      visualImgs = visualImgs.filter(img => img && typeof img === 'string' && img.trim());
                    }

                    let refImgs = [];
                    if (selectedTaskModal.ref_image) {
                      try {
                        const parsed = JSON.parse(selectedTaskModal.ref_image);
                        refImgs = Array.isArray(parsed) ? parsed : [selectedTaskModal.ref_image];
                      } catch {
                        refImgs = [selectedTaskModal.ref_image];
                      }
                      refImgs = refImgs.filter(img => img && typeof img === 'string' && img.trim());
                    }

                    return createPortal(
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl xl:max-w-6xl h-[88vh] max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                          
                          {/* Modal Header */}
                          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                  selectedTaskModal.status === 'Completed'   ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400' :
                                  selectedTaskModal.status === 'In Review'   ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-400' :
                                  selectedTaskModal.status === 'Rejected'    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400' :
                                  selectedTaskModal.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400' :
                                  'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                                }`}>
                                  {selectedTaskModal.status || 'To-Do'}
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
                                  {selectedTaskModal.category || 'General'}
                                </span>
                                {isAgentic && (
                                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-xs">
                                    <HiSparkles size={13} className="text-amber-500" /> Agentic AI Task
                                  </span>
                                )}
                                {selectedTaskModal.priority && selectedTaskModal.priority !== 'Medium' && (
                                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                    selectedTaskModal.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  }`}>
                                    <FiFlag size={12} /> {selectedTaskModal.priority}
                                  </span>
                                )}
                                {selectedTaskModal.was_delayed && (
                                  <span className="bg-rose-100 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                                    Delayed
                                  </span>
                                )}
                                {selectedTaskModal.was_resubmitted && (
                                  <span className="bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                                    Resubmitted ({selectedTaskModal.resubmit_count}x)
                                  </span>
                                )}
                                <span className="text-xs font-mono font-bold text-slate-400 ml-auto mr-1 hidden sm:inline">
                                  Task #{selectedTaskModal.id}
                                </span>
                              </div>
                              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                                {selectedTaskModal.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedTaskModal(null)}
                              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors shrink-0"
                            >
                              <FiX size={18} />
                            </button>
                          </div>

                          {/* Modal Tabs Navigation (5 Tabs, Sleek Full-Width Bar without Ugly Scrollbar) */}
                          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <button
                              type="button"
                              onClick={() => setModalActiveTab('overview')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                                modalActiveTab === 'overview'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <FiFileText size={14} />
                              <span>Overview & Specs</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalActiveTab('timeline')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                                modalActiveTab === 'timeline'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <FiClock size={14} />
                              <span>Timeline & Duration</span>
                              {workDuration && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold px-1.5 py-0.2 rounded-full">
                                  {workDuration}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalActiveTab('deliverables')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                                modalActiveTab === 'deliverables'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <FiFolder size={14} />
                              <span>Deliverables & Files</span>
                              {hasSubmissions && (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black px-1.5 py-0.2 rounded-full">
                                  {(selectedTaskModal.submissions?.length || 0) + (selectedTaskModal.submission_link ? 1 : 0)}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalActiveTab('marketplaces')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                                modalActiveTab === 'marketplaces'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <FiShoppingCart size={14} />
                              <span>Marketplaces</span>
                              {hasMarketplaces && (
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black px-1.5 py-0.2 rounded-full">
                                  {selectedTaskModal.marketplaces.length}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalActiveTab('review')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                                modalActiveTab === 'review'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <FiStar size={14} />
                              <span>Review & Feedback</span>
                              {selectedTaskModal.rating && (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-black px-1.5 py-0.2 rounded-full">
                                  ★ {selectedTaskModal.rating}
                                </span>
                              )}
                            </button>
                          </div>

                          {/* Modal Body: Active Tab Content */}
                          <div className="p-5 md:p-6 overflow-y-auto space-y-5 text-xs flex-1 min-h-0 custom-scrollbar">
                            
                            {/* TAB 1: OVERVIEW & SPECIFICATIONS (ADAPTIVE: AGENTIC VS MANUAL) */}
                            {modalActiveTab === 'overview' && (
                              <div className="space-y-5 animate-in fade-in duration-150">
                                
                                {isAgentic ? (
                                  /* ── 1. AGENTIC AI BLUEPRINT MODE ── */
                                  <div className="space-y-5">
                                    <AgenticBlueprintViewer 
                                      blueprint={blueprintObj} 
                                      variants={variantsList} 
                                    />

                                    {/* Raw JSON Debug View */}
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-[11px] text-slate-400">Want to inspect the raw JSON specification?</span>
                                      <button
                                        type="button"
                                        onClick={() => setShowRawJson(!showRawJson)}
                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
                                      </button>
                                    </div>

                                    {showRawJson && (
                                      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto relative font-mono text-xs">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(blueprintObj || specs, null, 2));
                                            setCopiedJson(true);
                                            setTimeout(() => setCopiedJson(false), 2000);
                                          }}
                                          className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white shadow-xs flex items-center gap-1"
                                        >
                                          <FiCopy size={11} />
                                          <span>{copiedJson ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                        <pre className="whitespace-pre-wrap leading-relaxed pr-12">
                                          {JSON.stringify(blueprintObj || specs, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* ── 2. MANUAL TASK MODE ── */
                                  <div className="space-y-5">
                                    {/* Task Description & Rich Instructions (Rendered at Top) */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        Description & Instructions
                                      </h4>
                                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <DescriptionRenderer htmlContent={selectedTaskModal.description} />
                                      </div>
                                    </div>

                                    {/* Assigned Info & Dates Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      {/* Assignee Card */}
                                      <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                          {selectedTaskModal.assigned_to_avatar ? (
                                            <img src={`${API_BASE}${selectedTaskModal.assigned_to_avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm uppercase">
                                              {selectedTaskModal.assigned_to_name ? selectedTaskModal.assigned_to_name.charAt(0) : 'S'}
                                            </div>
                                          )}
                                        </div>
                                        <div className="overflow-hidden min-w-0 flex-1">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</p>
                                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{selectedTaskModal.assigned_to_name || selectedTaskModal.employee_name || 'Staff'}</p>
                                        </div>
                                      </div>

                                      {/* Date Card */}
                                      <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                          <FiCalendar size={18} />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Assigned</p>
                                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                            {formatDateTime(tAssigned) || 'Assigned'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Time Spent Card */}
                                      <div className="bg-white dark:bg-slate-800/80 p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                          <FiClock size={18} />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time Spent</p>
                                          <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                                            {workDuration || 'In Progress'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Task Description & Rich Instructions */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        Description & Instructions
                                      </h4>
                                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <DescriptionRenderer htmlContent={selectedTaskModal.description} />
                                      </div>
                                    </div>

                                    {/* Sub-tasks / Checklists */}
                                    {checklists.length > 0 && (
                                      <div className="space-y-2.5">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                          Sub-tasks / Checklist ({checklists.filter(c => c.is_completed).length}/{checklists.length})
                                        </h4>
                                        <div className="space-y-2">
                                          {checklists.map((cl, idx) => (
                                            <div 
                                              key={idx} 
                                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                cl.is_completed 
                                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300' 
                                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                              }`}
                                            >
                                              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${
                                                cl.is_completed 
                                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                              }`}>
                                                {cl.is_completed && <FiCheck size={13} />}
                                              </div>
                                              <span className={`text-xs font-bold ${cl.is_completed ? 'line-through opacity-75' : ''}`}>
                                                {cl.title || cl.text}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reference Links */}
                                    {refLinks.length > 0 && (
                                      <div className="space-y-2.5">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference Links</h4>
                                        <div className="flex flex-col gap-2">
                                          {refLinks.map((link, idx) => (
                                            <a
                                              key={idx}
                                              href={link}
                                              target="_blank"
                                              rel="noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-xs transition-all truncate"
                                            >
                                              <FiLink size={14} className="text-slate-400 flex-shrink-0" />
                                              <span className="truncate">{link}</span>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Target Visual Images */}
                                    {visualImgs.length > 0 && (
                                      <div className="space-y-2.5">
                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                                          <FiTarget size={13} /> Target Visual Image
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {visualImgs.map((imgUrl, idx) => {
                                            const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                            return (
                                              <button
                                                key={idx}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLightboxImage(fullUrl); }}
                                                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 hover:shadow-md hover:border-indigo-400 transition-all group outline-none"
                                              >
                                                <img src={fullUrl} alt={`Target Visual ${idx + 1}`} className="w-full h-full object-contain bg-white dark:bg-slate-900 group-hover:scale-105 transition-transform duration-300" />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reference Images */}
                                    {refImgs.length > 0 && (
                                      <div className="space-y-2.5">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference Images</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {refImgs.map((imgUrl, idx) => {
                                            const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`;
                                            return (
                                              <button
                                                key={idx}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLightboxImage(fullUrl); }}
                                                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:shadow-md hover:border-slate-300 transition-all group outline-none"
                                              >
                                                <img src={fullUrl} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            )}

                            {/* TAB 2: TIMELINE & DURATION ANALYTICS */}
                            {modalActiveTab === 'timeline' && (
                              <div className="space-y-5 animate-in fade-in duration-150">
                                
                                {/* ⏱️ KEY TIME & DURATION ANALYTICS BREAKDOWN */}
                                <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-emerald-950/40 rounded-3xl border border-blue-200/80 dark:border-slate-800">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FiZap className="text-amber-500" />
                                    <span>Time Spent & Execution Duration Analysis</span>
                                  </h4>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {/* 1. Reaction Time */}
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Time to Start</p>
                                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                                        {startReactionDuration || 'Started Instantly'}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned → Started</p>
                                    </div>

                                    {/* 2. Active Work Duration (In Progress -> In Review) */}
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs bg-indigo-50/20">
                                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Work Duration</p>
                                      <p className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                                        {workDuration || 'In Progress'}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">In Progress → Submitted</p>
                                    </div>

                                    {/* 3. Review Duration */}
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
                                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Review Duration</p>
                                      <p className="text-sm font-black text-amber-700 dark:text-amber-300 mt-0.5">
                                        {reviewDuration || (selectedTaskModal.status === 'In Review' ? 'Under Review' : '-')}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">Submitted → Approved</p>
                                    </div>

                                    {/* 4. Total Turnaround Time */}
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
                                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Turnaround</p>
                                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        {totalTurnaround || (selectedTaskModal.status === 'Completed' ? 'Completed' : 'Active')}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned → Completion</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Visual Milestone Stepper */}
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FiActivity className="text-blue-600" />
                                    <span>Task Progress Lifecycle Stepper</span>
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                                    {/* 1. Assigned */}
                                    <div className="flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
                                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs">
                                        <FiCheckCircle size={15} />
                                        <span>1. Assigned</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                                        {formatDateTime(tAssigned) || 'Assigned'}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-medium">Task Dispatched</span>
                                    </div>

                                    {/* 2. In Progress / Started */}
                                    <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${
                                      tInProgress || ['In Progress', 'In Review', 'Completed', 'Rejected'].includes(selectedTaskModal.status)
                                        ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20'
                                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                                    }`}>
                                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                                        <FiClock size={15} />
                                        <span>2. Started Work</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                                        {formatDateTime(tInProgress) || (['In Progress', 'In Review', 'Completed'].includes(selectedTaskModal.status) ? 'In Progress' : 'Pending')}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-medium">Work Initiated</span>
                                    </div>

                                    {/* 3. Submitted / In Review */}
                                    <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${
                                      tSubmitted || ['In Review', 'Completed', 'Rejected'].includes(selectedTaskModal.status)
                                        ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20'
                                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                                    }`}>
                                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
                                        <FiCheckSquare size={15} />
                                        <span>3. Submitted</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                                        {formatDateTime(tSubmitted) || (['In Review', 'Completed'].includes(selectedTaskModal.status) ? 'Submitted' : 'Pending Submission')}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-medium">Under Review</span>
                                    </div>

                                    {/* 4. Completed / Approved */}
                                    <div className={`flex flex-col space-y-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs relative ${
                                      selectedTaskModal.status === 'Completed'
                                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                                    }`}>
                                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                                        <FiCheckCircle size={15} />
                                        <span>4. Completed</span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                                        {selectedTaskModal.status === 'Completed'
                                          ? (formatDateTime(tCompleted) || 'Completed')
                                          : 'In Progress'}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-medium">Final Approval</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Resubmissions & Rejections Info */}
                                {(selectedTaskModal.was_resubmitted || selectedTaskModal.was_delayed || (selectedTaskModal.rejections && selectedTaskModal.rejections.length > 0)) && (
                                  <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <FiAlertCircle size={14} />
                                      <span>Revision & Resubmission Log</span>
                                    </h4>

                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                                      <div>
                                        <span className="text-slate-400">Total Resubmissions:</span>{' '}
                                        <span className="text-rose-600 font-black">{selectedTaskModal.resubmit_count || 0} time(s)</span>
                                      </div>
                                      {selectedTaskModal.was_delayed && (
                                        <div className="text-rose-600 font-bold bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-lg">
                                          Delayed Completion Flagged
                                        </div>
                                      )}
                                    </div>

                                    {selectedTaskModal.rejections && selectedTaskModal.rejections.length > 0 && (
                                      <div className="space-y-2 pt-1">
                                        {selectedTaskModal.rejections.map((rej, idx) => (
                                          <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/40 text-xs">
                                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                                              <span>Rejection #{idx + 1} by {rej.changed_by}</span>
                                              <span>{formatDateTime(rej.rejected_at)}</span>
                                            </div>
                                            <p className="text-rose-700 dark:text-rose-300 font-medium">
                                              {rej.comment || 'No specific comment provided.'}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Full Audit Transition Logs */}
                                {selectedTaskModal.logs && selectedTaskModal.logs.length > 0 && (
                                  <div className="space-y-2.5">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                      Detailed Status Transition History
                                    </h4>
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                      <table className="w-full text-left text-xs">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                            <th className="py-2.5 px-4">From</th>
                                            <th className="py-2.5 px-4">To</th>
                                            <th className="py-2.5 px-4">Changed By</th>
                                            <th className="py-2.5 px-4">Timestamp</th>
                                            <th className="py-2.5 px-4">Comment</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                          {selectedTaskModal.logs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                              <td className="py-2 px-4 font-semibold text-slate-500">{log.status_from || '-'}</td>
                                              <td className="py-2 px-4 font-bold text-slate-800 dark:text-slate-100">{log.status_to}</td>
                                              <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{log.changed_by_name || 'System'}</td>
                                              <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                              <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{log.comment || '-'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 3: DELIVERABLES & FILES */}
                            {modalActiveTab === 'deliverables' && (
                              <div className="space-y-5 animate-in fade-in duration-150">
                                {/* Submission Link Card */}
                                {selectedTaskModal.submission_link ? (
                                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiLink />
                                        <span>Primary Deliverable External Link</span>
                                      </p>
                                      <p className="text-xs text-emerald-950 dark:text-emerald-100 font-semibold break-all">
                                        {selectedTaskModal.submission_link}
                                      </p>
                                    </div>
                                    <a
                                      href={selectedTaskModal.submission_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                                    >
                                      <span>Open Link</span>
                                      <FiExternalLink size={13} />
                                    </a>
                                  </div>
                                ) : null}

                                {/* Reviewer Stock-Ready Final Delivery */}
                                {selectedTaskModal.final_delivery && (
                                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiCheckCircle />
                                        <span>Reviewer Final Stock-Ready Delivery</span>
                                      </h4>
                                      <span className="text-[10px] font-bold bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded">
                                        Approved & Packaged
                                      </span>
                                    </div>

                                    {selectedTaskModal.final_delivery.fix_notes && (
                                      <p className="text-xs text-indigo-900 dark:text-indigo-200 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl">
                                        <span className="font-bold">Fix Notes:</span> {selectedTaskModal.final_delivery.fix_notes}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                      {selectedTaskModal.final_delivery.final_file_url && (
                                        <a
                                          href={selectedTaskModal.final_delivery.final_file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
                                        >
                                          <FiDownload size={13} />
                                          <span>Download Final Source File</span>
                                        </a>
                                      )}
                                      {selectedTaskModal.final_delivery.final_image_url && (
                                        <a
                                          href={selectedTaskModal.final_delivery.final_image_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl hover:bg-indigo-50 transition-colors"
                                        >
                                          <FiImage size={13} />
                                          <span>View Final Preview</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Uploaded Submissions Files (Cloudflare R2 Files) */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <FiFile size={13} />
                                    <span>Uploaded Submission Files ({selectedTaskModal.submissions?.length || 0})</span>
                                  </h4>

                                  {selectedTaskModal.submissions && selectedTaskModal.submissions.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {selectedTaskModal.submissions.map((sub, idx) => {
                                        const isImg = sub.file_ext?.match(/(jpg|jpeg|png|webp|gif)/i) || sub.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                                        return (
                                          <div 
                                            key={idx}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              {isImg ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0">
                                                  <img src={sub.file_url} alt={sub.file_name} className="w-full h-full object-cover" />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-xs flex-shrink-0 uppercase border border-blue-100 dark:border-blue-900/50">
                                                  {sub.file_ext || 'FILE'}
                                                </div>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
                                                  {sub.file_name || `Submission #${idx + 1}`}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                  {sub.file_size ? `${Math.round(sub.file_size / 1024)} KB` : 'Uploaded'} • {formatDateTime(sub.created_at)}
                                                </p>
                                              </div>
                                            </div>

                                            <a
                                              href={sub.file_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs transition-colors shrink-0"
                                              title="Download / Open File"
                                            >
                                              <FiDownload size={14} />
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    !selectedTaskModal.submission_link && !selectedTaskModal.final_delivery && (
                                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
                                        No files or submission links uploaded for this task yet.
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* TAB 4: MARKETPLACES & DISTRIBUTION */}
                            {modalActiveTab === 'marketplaces' && (
                              <div className="space-y-5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                    <FiGlobe className="text-blue-600" />
                                    <span>Stock Marketplace Submissions ({selectedTaskModal.marketplaces?.length || 0})</span>
                                  </h4>
                                </div>

                                {selectedTaskModal.marketplaces && selectedTaskModal.marketplaces.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {selectedTaskModal.marketplaces.map((m, idx) => {
                                      const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom Market') : m.marketplace;
                                      return (
                                        <div 
                                          key={m.id || idx}
                                          className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
                                        >
                                          <div className="space-y-2">
                                            {/* Top row: Marketplace name & status pill */}
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                <FiShoppingCart className="text-blue-500" size={14} />
                                                <span>{marketName}</span>
                                              </span>
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                                m.status === 'Live' || m.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                                                m.status === 'Submitted' || m.status === 'Under Review' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                                                m.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                                                'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                              }`}>
                                                {m.status || 'Pending'}
                                              </span>
                                            </div>

                                            {/* Metadata */}
                                            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                              <div className="flex justify-between">
                                                <span>Submitted Date:</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                  {m.submitted_date ? formatDateTime(m.submitted_date) : formatDateTime(m.created_at)}
                                                </span>
                                              </div>
                                              {m.added_by_name && (
                                                <div className="flex justify-between">
                                                  <span>Uploaded By:</span>
                                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{m.added_by_name} ({m.added_by_role || 'Reviewer'})</span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Marketplace Audit History Logs */}
                                            {m.logs && m.logs.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status History</p>
                                                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                                  {m.logs.map((l, lIdx) => (
                                                    <div key={lIdx} className="text-[10px] bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg flex justify-between items-center">
                                                      <span>
                                                        <span className="text-slate-400">{l.status_from || 'Initial'}</span> → <span className="font-bold text-slate-700 dark:text-slate-200">{l.status_to}</span>
                                                      </span>
                                                      <span className="text-slate-400">{formatDateTime(l.created_at)}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
                                    No marketplace submission records found for this task yet. Marketplace distribution is managed by Reviewers/Admins after quality approval.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 5: REVIEW & FEEDBACK */}
                            {modalActiveTab === 'review' && (
                              <div className="space-y-5 animate-in fade-in duration-150">
                                {/* Rating & Reviewer Banner */}
                                <div className="p-4 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-slate-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Quality Score & Review</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                        {selectedTaskModal.rating ? `${selectedTaskModal.rating} / 5` : 'Not Rated Yet'}
                                      </span>
                                      {selectedTaskModal.rating && (
                                        <div className="flex text-amber-500 text-sm">
                                          {Array.from({ length: Math.min(5, Math.max(1, parseInt(selectedTaskModal.rating) || 5)) }).map((_, i) => (
                                            <span key={i}>★</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-left sm:text-right space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reviewer</p>
                                    <p className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                      {selectedTaskModal.reviewer_name || 'QA Reviewer'}
                                    </p>
                                    {selectedTaskModal.reviewed_at && (
                                      <p className="text-[10px] text-slate-400">
                                        {formatDateTime(selectedTaskModal.reviewed_at)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Review Tags */}
                                {selectedTaskModal.tags && selectedTaskModal.tags.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                      <FiTag size={13} className="text-amber-500" />
                                      <span>Evaluation Tags</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {selectedTaskModal.tags.map((tag, i) => (
                                        <span 
                                          key={i} 
                                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-lg"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Reviewer Feedback Notes */}
                                {selectedTaskModal.feedback_notes && (
                                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                      <FiMessageSquare size={13} className="text-blue-500" />
                                      <span>Reviewer Feedback Notes</span>
                                    </h4>
                                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                                      {selectedTaskModal.feedback_notes}
                                    </p>
                                  </div>
                                )}

                                {/* Admin Rejection / Correction Notes */}
                                {selectedTaskModal.admin_note && (
                                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1.5">
                                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <FiXCircle />
                                      <span>Rejection Reason & Revision Requirements</span>
                                    </h4>
                                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                                      {selectedTaskModal.admin_note}
                                    </p>
                                  </div>
                                )}

                                {!hasReview && (
                                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
                                    No review evaluation or feedback recorded for this task yet.
                                  </div>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Modal Footer */}
                          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
                            <div className="text-[11px] font-bold text-slate-400">
                              Status: <span className="text-slate-700 dark:text-slate-200">{selectedTaskModal.status || 'To-Do'}</span>
                              {workDuration && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">• Work: {workDuration}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedTaskModal.submission_link && (
                                <a
                                  href={selectedTaskModal.submission_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                                >
                                  <FiExternalLink size={12} />
                                  <span>Open Link</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedTaskModal(null)}
                                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>,
                      document.body
                    );
                  })()}
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
                  Select an employee and period to load task deliverables.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Lightbox for Target Visual and Reference Images */}
      <ImageLightbox 
        image={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
        apiBase={API_BASE} 
      />
    </div>
  );
};

export default Reports;
