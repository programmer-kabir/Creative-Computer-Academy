import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiEye,
  FiActivity,
  FiUsers,
  FiLayers,
  FiPrinter,
  FiSearch,
  FiFilter,
  FiArrowUpRight,
  FiAward,
  FiLink,
  FiZap,
  FiBarChart2,
  FiPieChart,
  FiExternalLink
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

// Custom Dropdown Component
const CustomSelect = ({ value, onChange, options, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm font-bold rounded-2xl h-12 pl-10 pr-4 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 transition-all text-left shadow-sm"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
          {Icon && <Icon size={16} />}
        </div>
        <span className="truncate mr-2">{selectedOption?.label}</span>
        <FiChevronDown size={18} className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-40 py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between ${String(value) === String(opt.value) ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
              >
                <span className="truncate">{opt.label}</span>
                {String(value) === String(opt.value) && <FiCheck className="text-blue-600 flex-shrink-0 ml-2" size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MasterReport = () => {
  const navigate = useNavigate();

  // Date preset and values
  const [periodPreset, setPeriodPreset] = useState('month'); // today, week, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  // Filter, Search, Sort & Expanded rows
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [sortBy, setSortBy] = useState('overall'); // 'overall' | 'tasks_completed' | 'attendance_rate' | 'task_worked' | 'total_worked' | 'quality' | 'name'
  const [expandedStaffId, setExpandedStaffId] = useState(null);

  const periodOptions = [
    { value: 'today', label: 'Daily (Today)' },
    { value: 'week', label: 'Weekly (Last 7 Days)' },
    { value: 'month', label: 'Monthly (This Month)' },
    { value: 'year', label: 'Yearly (This Year)' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getPresetDates = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      // today
    } else if (preset === 'week') {
      start.setDate(today.getDate() - 6);
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(end)
    };
  };

  useEffect(() => {
    if (periodPreset !== 'custom') {
      const dates = getPresetDates(periodPreset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  }, [periodPreset]);

  // Fetch Company Master Report
  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}api/reports/get_all_staff_report.php`, {
        start_date: startDate,
        end_date: endDate
      });

      if (res.data.status === 'success') {
        setReportData(res.data);
      } else {
        setError(res.data.message || 'Failed to load master report.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // Departments List
  const departmentOptions = useMemo(() => {
    if (!reportData || !reportData.staff_data) return ['all'];
    const depts = new Set();
    reportData.staff_data.forEach(s => {
      if (s.department_name) depts.add(s.department_name);
    });
    return ['all', ...Array.from(depts)];
  }, [reportData]);

  // Filtered and Sorted Staff List
  const filteredStaff = useMemo(() => {
    if (!reportData || !reportData.staff_data) return [];
    let list = [...reportData.staff_data];

    if (selectedDept !== 'all') {
      list = list.filter(s => s.department_name === selectedDept);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.department_name && s.department_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'overall') return b.efficiency_score - a.efficiency_score;
      if (sortBy === 'tasks_completed') return b.tasks_completed - a.tasks_completed;
      if (sortBy === 'attendance_rate') return b.attendance_rate - a.attendance_rate;
      if (sortBy === 'task_worked') return b.task_worked_seconds - a.task_worked_seconds;
      if (sortBy === 'total_worked') return b.total_worked_seconds - a.total_worked_seconds;
      if (sortBy === 'quality') return a.rejection_rate - b.rejection_rate;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [reportData, selectedDept, searchTerm, sortBy]);

  // Top 3 Performers
  const topPerformers = useMemo(() => {
    if (!reportData || !reportData.staff_data || reportData.staff_data.length === 0) return [];
    return [...reportData.staff_data]
      .sort((a, b) => (b.tasks_completed * 2 + b.attendance_rate) - (a.tasks_completed * 2 + a.attendance_rate))
      .slice(0, 3);
  }, [reportData]);

  const toggleExpand = (id) => {
    setExpandedStaffId(prev => prev === id ? null : id);
  };

  // ─── Export to Excel (.xls) ────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!reportData || !filteredStaff.length) return;
    const summary = reportData.company_summary;
    const filename = `CCA_Company_Master_Performance_Report_${startDate}_to_${endDate}.xls`;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .header-title { font-size: 18pt; font-weight: bold; color: #1e3a8a; }
          .sub-title { font-size: 11pt; color: #475569; }
          .kpi-table { margin-bottom: 20px; border-collapse: collapse; width: 100%; }
          .kpi-th { background-color: #0284c7; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #0369a1; text-align: center; }
          .kpi-td { background-color: #f0f9ff; padding: 10px; font-weight: bold; font-size: 14pt; color: #0369a1; border: 1px solid #bae6fd; text-align: center; }
          .main-table { border-collapse: collapse; width: 100%; }
          .main-th { background-color: #1e293b; color: #ffffff; padding: 8px 12px; font-weight: bold; border: 1px solid #334155; text-align: left; }
          .main-td { padding: 8px 12px; border: 1px solid #cbd5e1; }
          .badge-green { background-color: #dcfce7; color: #15803d; font-weight: bold; }
          .badge-amber { background-color: #fef3c7; color: #b45309; font-weight: bold; }
          .badge-red { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <p class="header-title">Creative Computer Academy — Company Master Performance Report</p>
        <p class="sub-title"><strong>Report Period:</strong> ${startDate} to ${endDate} | <strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
        <br />
        
        <table class="kpi-table">
          <tr>
            <th class="kpi-th">Active Staff</th>
            <th class="kpi-th">Attendance Rate</th>
            <th class="kpi-th">Total Office Hours</th>
            <th class="kpi-th">Tasks Assigned</th>
            <th class="kpi-th">Tasks Completed</th>
            <th class="kpi-th">Task Work Duration</th>
            <th class="kpi-th">Revisions / Rejections</th>
          </tr>
          <tr>
            <td class="kpi-td">${summary.total_employees}</td>
            <td class="kpi-td">${summary.overall_attendance_rate}%</td>
            <td class="kpi-td">${summary.total_worked_formatted}</td>
            <td class="kpi-td">${summary.total_tasks_assigned}</td>
            <td class="kpi-td">${summary.total_tasks_completed}</td>
            <td class="kpi-td">${summary.total_task_worked_formatted}</td>
            <td class="kpi-td">${summary.total_tasks_rejected}</td>
          </tr>
        </table>
        <br />

        <table class="main-table">
          <thead>
            <tr>
              <th class="main-th">#</th>
              <th class="main-th">Employee Name</th>
              <th class="main-th">Department</th>
              <th class="main-th">Designation</th>
              <th class="main-th text-center">Present</th>
              <th class="main-th text-center">Late</th>
              <th class="main-th text-center">Absent</th>
              <th class="main-th text-center">Attendance %</th>
              <th class="main-th text-center">Office Hours</th>
              <th class="main-th text-center">Tasks Assigned</th>
              <th class="main-th text-center">Tasks Completed</th>
              <th class="main-th text-center">In Review</th>
              <th class="main-th text-center">In Progress</th>
              <th class="main-th text-center">Rejections</th>
              <th class="main-th text-center">Task Working Time</th>
              <th class="main-th text-center">Completion Rate</th>
              <th class="main-th text-center">Efficiency Score</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map((s, idx) => `
              <tr>
                <td class="main-td text-center">${idx + 1}</td>
                <td class="main-td"><strong>${s.name}</strong></td>
                <td class="main-td">${s.department_name}</td>
                <td class="main-td">${s.designation}</td>
                <td class="main-td text-center badge-green">${s.present_days}</td>
                <td class="main-td text-center badge-amber">${s.late_days}</td>
                <td class="main-td text-center badge-red">${s.absent_days}</td>
                <td class="main-td text-center"><strong>${s.attendance_rate}%</strong></td>
                <td class="main-td text-center">${s.total_worked_formatted}</td>
                <td class="main-td text-center">${s.tasks_assigned}</td>
                <td class="main-td text-center badge-green">${s.tasks_completed}</td>
                <td class="main-td text-center">${s.tasks_in_review}</td>
                <td class="main-td text-center">${s.tasks_in_progress}</td>
                <td class="main-td text-center ${s.tasks_rejected > 0 ? 'badge-red' : ''}">${s.tasks_rejected}</td>
                <td class="main-td text-center"><strong>${s.task_worked_formatted}</strong></td>
                <td class="main-td text-center"><strong>${s.completion_rate}%</strong></td>
                <td class="main-td text-center"><strong>${s.efficiency_score}%</strong></td>
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

  // ─── Export to PDF (Direct Styled Document) ────────────────────────────────
  const handleExportPDF = () => {
    if (!reportData || !filteredStaff.length) return;
    const summary = reportData.company_summary;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCA Company Master Report (${startDate} to ${endDate})</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 10mm;
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
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0 0;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748b;
            margin: 0 0 4px 0;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 900;
            color: #1e293b;
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .badge-a { background: #fee2e2; color: #991b1b; padding: 2px 5px; border-radius: 4px; font-weight: 800; font-size: 9px; }
          .badge-tier { background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; border: 1px solid #bfdbfe; }
          .footer {
            margin-top: 14px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Creative Computer Academy</h1>
            <p class="brand-sub">Company Master Performance & Workforce Attendance Report</p>
          </div>
          <div class="meta-info">
            <p style="margin:0;"><strong>Report Period:</strong> ${startDate} to ${endDate}</p>
            <p style="margin:3px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <p class="kpi-label">Active Workforce</p>
            <p class="kpi-val">${summary.total_employees} Employees</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Company Attendance</p>
            <p class="kpi-val" style="color:#059669;">${summary.overall_attendance_rate}%</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Tasks Completed</p>
            <p class="kpi-val" style="color:#4f46e5;">${summary.total_tasks_completed} / ${summary.total_tasks_assigned} (${summary.overall_completion_rate}%)</p>
          </div>
          <div class="kpi-card">
            <p class="kpi-label">Task Work Duration</p>
            <p class="kpi-val" style="color:#7c3aed;">${summary.total_task_worked_formatted}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width:30px;">#</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th class="text-center">Attendance</th>
              <th class="text-center">Office Duty</th>
              <th class="text-center">Tasks Done</th>
              <th class="text-center">Task Working Time</th>
              <th class="text-center">Rejections</th>
              <th class="text-center">On-Time</th>
              <th class="text-center">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map((s, idx) => `
              <tr>
                <td class="text-center font-bold">${idx + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.department_name}</td>
                <td>${s.designation}</td>
                <td class="text-center">
                  <strong>${s.attendance_rate}%</strong>
                  <span style="font-size:8px; color:#64748b; display:block;">${s.present_days}P / ${s.late_days}L / ${s.absent_days}A</span>
                </td>
                <td class="text-center font-bold">${s.total_worked_formatted}</td>
                <td class="text-center">
                  <strong>${s.tasks_completed} / ${s.tasks_assigned}</strong>
                  <span style="font-size:8px; color:#4f46e5; display:block;">${s.completion_rate}% Done</span>
                </td>
                <td class="text-center font-bold" style="color:#7c3aed;">${s.task_worked_formatted}</td>
                <td class="text-center font-bold ${s.tasks_rejected > 0 ? 'badge-a' : ''}">${s.tasks_rejected}x</td>
                <td class="text-center">${s.on_time_rate}%</td>
                <td class="text-center"><span class="badge-tier">${s.efficiency_score}% (${s.performance_tier})</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Creative Computer Academy Management System • Official Confidential Report</p>
        </div>

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

  // ─── Export to CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!reportData || !filteredStaff.length) return;
    const headers = ['Employee Name', 'Department', 'Designation', 'Present Days', 'Late Days', 'Absent Days', 'Attendance Rate %', 'Office Hours Worked', 'Tasks Assigned', 'Tasks Completed', 'In Review', 'In Progress', 'Rejections', 'Task Working Time', 'Completion Rate %', 'Efficiency Score'];
    const rows = filteredStaff.map(s => [
      s.name,
      s.department_name,
      s.designation,
      s.present_days,
      s.late_days,
      s.absent_days,
      `${s.attendance_rate}%`,
      s.total_worked_formatted,
      s.tasks_assigned,
      s.tasks_completed,
      s.tasks_in_review,
      s.tasks_in_progress,
      s.tasks_rejected,
      s.task_worked_formatted,
      `${s.completion_rate}%`,
      `${s.efficiency_score}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCA_Company_Master_Performance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-12 animate-in fade-in zoom-in-95 duration-300">

      {/* ──────── Header Title ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Company Master Analytics & Performance</span>
            <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full uppercase tracking-wider shadow-sm">
              Workforce Intelligence
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Comprehensive multi-dimensional analysis of employee output, attendance fidelity, and task durations.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Download formatted Excel Spreadsheet"
          >
            <FiDownload size={15} />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Export as Landscape PDF Document"
          >
            <FiPrinter size={15} />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* ──────── Control Panel: Date Filters ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-wrap items-end gap-4">

          {/* Period Selection */}
          <div className="w-full sm:w-64">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Time Period
            </label>
            <CustomSelect
              value={periodPreset}
              onChange={setPeriodPreset}
              options={periodOptions}
              icon={FiClock}
            />
          </div>

          {/* Date pickers (if custom) */}
          {periodPreset === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-44">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl h-12 px-4 w-full">
                  <FiCalendar className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                  />
                </div>
              </div>
              <span className="text-slate-400 dark:text-slate-500 font-bold px-1 self-end mb-3 hidden sm:inline">to</span>
              <div className="w-full sm:w-44">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl h-12 px-4 w-full">
                  <FiCalendar className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-800 flex-shrink-0"
              title="Refresh Data"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || !reportData}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-12 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <FiDownload size={15} />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-2 mb-8">
          <FiAlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ──────── KPI SUMMARY CARDS ──────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Aggregating Comprehensive Workforce Metrics...</p>
        </div>
      ) : reportData && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* 1. Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Total Workforce */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Active Workforce</p>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                    {reportData.company_summary.total_employees} <span className="text-xs font-bold text-slate-400 font-normal">Employees</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Calendar Range: {reportData.period.days_count} Days
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <FiUsers size={22} />
                </div>
              </div>
            </div>

            {/* 2. Overall Attendance Rate */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Company Attendance</p>
                  <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                    {reportData.company_summary.overall_attendance_rate}%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-2">
                    <span>P: <strong className="text-emerald-600">{reportData.company_summary.total_present_count}</strong></span>
                    <span>L: <strong className="text-amber-500">{reportData.company_summary.total_late_count}</strong></span>
                    <span>A: <strong className="text-rose-500">{reportData.company_summary.total_absent_count}</strong></span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                  <FiCheckCircle size={22} />
                </div>
              </div>
            </div>

            {/* 3. Tasks Completed */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Tasks Output</p>
                  <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
                    {reportData.company_summary.total_tasks_completed} <span className="text-xs text-slate-400 font-normal">/ {reportData.company_summary.total_tasks_assigned}</span>
                  </h3>
                  <p className="text-[11px] text-indigo-500 dark:text-indigo-300 mt-2 font-semibold">
                    {reportData.company_summary.overall_completion_rate}% Completed Across Team
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <FiAward size={22} />
                </div>
              </div>
            </div>

            {/* 4. Task Work Duration */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Task Work Duration</p>
                  <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400 leading-tight">
                    {reportData.company_summary.total_task_worked_formatted}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Office Duty Time: <strong className="text-slate-700 dark:text-slate-300">{reportData.company_summary.total_worked_formatted}</strong>
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                  <FiClock size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Top Performers Podium & Department Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top 3 Performers Spotlight */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-900/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <HiSparkles className="text-amber-400" />
                    Top Contributors
                  </span>
                  <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold">This Period</span>
                </div>

                <div className="space-y-3 mt-2">
                  {topPerformers.map((staff, idx) => (
                    <div
                      key={staff.user_id}
                      onClick={() => toggleExpand(staff.user_id)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' :
                            idx === 1 ? 'bg-slate-300 text-slate-950' :
                              'bg-amber-700 text-white'
                          }`}>
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                          {staff.profile_picture ? (
                            <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{staff.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold truncate max-w-[130px]">{staff.name}</p>
                          <p className="text-[10px] text-white/50">{staff.department_name}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-400">{staff.tasks_completed} Done</p>
                        <p className="text-[10px] text-white/40">{staff.attendance_rate}% Att</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-white/50">
                <span>Weighted by output & attendance</span>
                <span className="text-indigo-400 font-bold">Auto-Ranked</span>
              </div>
            </div>

            {/* Department-wise Productivity Snapshot */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FiLayers className="text-blue-600" />
                    <span>Department Performance Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Team Distribution</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(reportData.department_stats || []).map((dept, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedDept(dept.department_name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedDept === dept.department_name
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate" title={dept.department_name}>
                          {dept.department_name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {dept.staff_count} Staff
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                          <span>Tasks Done:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{dept.tasks_completed} / {dept.tasks_assigned}</strong>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${dept.completion_rate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                          <span>Work Duration:</span>
                          <strong className="text-purple-600 dark:text-purple-400">{dept.task_worked_formatted}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Click any department card above to filter the master table.</span>
                {selectedDept !== 'all' && (
                  <button onClick={() => setSelectedDept('all')} className="text-blue-600 font-bold hover:underline">
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Search, Filter & Sorter Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Staff */}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search staff name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              {/* Department Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
                {departmentOptions.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedDept === dept
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {dept === 'all' ? 'All Departments' : dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <span className="text-xs font-bold text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="overall">🌟 Overall Performance</option>
                <option value="tasks_completed">🎯 Tasks Completed</option>
                <option value="attendance_rate">📅 Attendance Rate % </option>
                <option value="task_worked">⏱️ Task Work Duration </option>
                <option value="total_worked">💼 Office Hours Worked </option>
                <option value="quality">✨ Best Quality</option>
                <option value="name">🔤 Staff Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* 4. Multi-Dimensional Master Directory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <FiUsers className="text-blue-600" />
                  <span>Company Staff Performance Directory ({filteredStaff.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any staff row to expand detailed task deliverables and recent attendance logs.
                </p>
              </div>

              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40 self-start sm:self-auto">
                Interactive Drilldown Enabled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-4 text-center w-12">#</th>
                    <th className="py-4 px-4">Employee</th>
                    <th className="py-4 px-4">Department</th>
                    <th className="py-4 px-4 text-center">Attendance %</th>
                    <th className="py-4 px-4 text-center">Duty Hours</th>
                    <th className="py-4 px-4 text-center">Tasks Output</th>
                    <th className="py-4 px-4 text-center">Working Time Tracked</th>
                    <th className="py-4 px-4 text-center">Rejections</th>
                    <th className="py-4 px-4 text-center">Efficiency</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff, idx) => {
                      const isExpanded = expandedStaffId === staff.user_id;

                      return (
                        <React.Fragment key={staff.user_id}>
                          <tr
                            onClick={() => toggleExpand(staff.user_id)}
                            className={`cursor-pointer transition-colors ${isExpanded
                                ? 'bg-blue-50/40 dark:bg-slate-800/80 border-l-4 border-l-blue-600'
                                : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                              }`}
                          >
                            {/* Rank */}
                            <td className="py-4 px-4 text-center font-black text-xs text-slate-400">
                              {idx + 1}
                            </td>

                            {/* Employee Profile */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                                  {staff.profile_picture ? (
                                    <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{staff.name.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-slate-900 dark:text-white leading-snug">{staff.name}</p>
                                    {staff.performance_tier === 'Top Performer' && (
                                      <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-500 text-[10px] font-black rounded">⭐️ Top</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{staff.designation}</p>
                                </div>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {staff.department_name}
                              </span>
                            </td>

                            {/* Attendance % */}
                            <td className="py-4 px-4 text-center">
                              <div>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${staff.attendance_rate >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                    staff.attendance_rate >= 75 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                      'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                  }`}>
                                  {staff.attendance_rate}%
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                  {staff.present_days}P / {staff.late_days}L / {staff.absent_days}A
                                </p>
                              </div>
                            </td>

                            {/* Duty Hours */}
                            <td className="py-4 px-4 text-center">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{staff.total_worked_formatted}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Avg {staff.avg_daily_hours}h/day
                              </p>
                            </td>

                            {/* Tasks Output */}
                            <td className="py-4 px-4 text-center">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {staff.tasks_completed} <span className="text-slate-400 font-normal">/ {staff.tasks_assigned}</span>
                                </span>
                                <div className="w-20 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${staff.completion_rate}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                                  {staff.completion_rate}% Done
                                </p>
                              </div>
                            </td>

                            {/* Working Time Tracked */}
                            <td className="py-4 px-4 text-center">
                              <span className="font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-900/40">
                                {staff.task_worked_formatted}
                              </span>
                            </td>

                            {/* Rejections */}
                            <td className="py-4 px-4 text-center">
                              {staff.tasks_rejected > 0 ? (
                                <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-full border border-rose-200 dark:border-rose-900/40">
                                  {staff.tasks_rejected}x ({staff.rejection_rate}%)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Efficiency Score */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${staff.efficiency_score >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                                    staff.efficiency_score >= 60 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                                      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                  }`}>
                                  {staff.efficiency_score}%
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                                  {staff.performance_tier}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleExpand(staff.user_id)}
                                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={isExpanded ? "Collapse Details" : "Expand Details"}
                                >
                                  {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                </button>
                                <button
                                  onClick={() => navigate(`/reports?staff=${staff.user_id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-all border border-blue-200 dark:border-blue-800"
                                >
                                  <span>Inspect</span>
                                  <FiArrowUpRight size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ── EXPANDABLE IN-PLACE DRILLDOWN PANEL ── */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-950/60">
                              <td colSpan="10" className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">

                                  {/* Left: Recent Tasks */}
                                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                        <FiFileText className="text-blue-600" />
                                        <span>Recent Tasks & Deliverables ({(staff.recent_tasks || []).length})</span>
                                      </h4>
                                      <button
                                        onClick={() => navigate(`/reports?staff=${staff.user_id}&tab=tasks`)}
                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        View All Tasks →
                                      </button>
                                    </div>

                                    {staff.recent_tasks && staff.recent_tasks.length > 0 ? (
                                      <div className="space-y-2.5">
                                        {staff.recent_tasks.map((task, tidx) => (
                                          <div key={task.id || tidx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                                            <div className="min-w-0 flex-1 pr-3">
                                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                                              <p className="text-[10px] text-slate-400 mt-0.5">
                                                {task.category || 'General'} • Assign: {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                  task.status === 'In Review' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                                    task.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                                      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                                }`}>
                                                {task.status}
                                              </span>
                                              {task.submission_link && (
                                                <a
                                                  href={task.submission_link}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white"
                                                  title="Open submission link"
                                                >
                                                  <FiLink size={12} />
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic py-4 text-center">No tasks recorded in this period.</p>
                                    )}
                                  </div>

                                  {/* Right: Recent Attendance Logs */}
                                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                        <FiClock className="text-emerald-600" />
                                        <span>Recent Attendance Activity ({(staff.recent_attendance || []).length} Days)</span>
                                      </h4>
                                      <button
                                        onClick={() => navigate(`/reports?staff=${staff.user_id}&tab=attendance`)}
                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        View All Logs →
                                      </button>
                                    </div>

                                    {staff.recent_attendance && staff.recent_attendance.length > 0 ? (
                                      <div className="space-y-2">
                                        {staff.recent_attendance.map((att, aidx) => (
                                          <div key={aidx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                              {new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}
                                            </span>
                                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                              <span>In: {att.check_in || '--:--'}</span>
                                              <span>Out: {att.check_out || '--:--'}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                att.status === 'Late' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                                  att.status === 'Absent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                                    'bg-slate-200 text-slate-700'
                                              }`}>
                                              {att.status || 'Present'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400 italic py-4 text-center">No attendance logs found in this period.</p>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400 font-bold italic">
                        No staff records found matching filter criteria.
                      </td>
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

export default MasterReport;
