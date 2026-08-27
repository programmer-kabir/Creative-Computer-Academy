import React, { useState, useEffect, useMemo } from 'react';
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
  FiLink
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

// Custom Stylish Dropdown Component
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
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between ${
                  String(value) === String(opt.value) ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-bold' : 'text-slate-700 dark:text-slate-200'
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

const Reports = () => {
  // Staff listing
  const [staffList, setStaffList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const staffParam = searchParams.get('staff');
  const tabParam = searchParams.get('tab') || 'attendance';
  
  const [selectedStaffId, setSelectedStaffId] = useState(staffParam || '');
  const [activeTab, setActiveTab] = useState(tabParam);

  // Date preset and values
  const [periodPreset, setPeriodPreset] = useState('month'); // today, week, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [attReport, setAttReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [error, setError] = useState('');

  // Dropdown Memoized Options (Individual Staff Only)
  const employeeOptions = useMemo(() => {
    return staffList.map(staff => ({
      value: String(staff.id),
      label: `${staff.name} (${staff.designation || 'Staff'})`
    }));
  }, [staffList]);

  const periodOptions = [
    { value: 'today', label: 'Daily (Today)' },
    { value: 'week', label: 'Weekly (Last 7 Days)' },
    { value: 'month', label: 'Monthly (This Month)' },
    { value: 'year', label: 'Yearly (This Year)' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

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

  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Preset Date Helper
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

      {/* ──────── Control Panel: Filters ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-wrap items-end gap-4">
          
          {/* Employee Dropdown */}
          <div className="w-full md:w-80">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Select Employee
            </label>
            <CustomSelect
              value={selectedStaffId}
              onChange={setSelectedStaffId}
              options={employeeOptions}
              icon={FiUser}
            />
          </div>

          {/* Period Selection */}
          <div className="w-full sm:w-60">
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
              onClick={fetchReports} 
              disabled={loading}
              className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-800 flex-shrink-0"
              title="Refresh Data"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>
            
            <button 
              onClick={handleExportCSV}
              disabled={loading || !selectedStaffInfo}
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
                        <h3 className="text-3xl font-black text-slate-850 dark:text-white">{taskReport.summary.total_assigned}</h3>
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

                  {/* Tasks List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Task Log Details</h3>
                    {taskReport.tasks && taskReport.tasks.length > 0 ? (
                      taskReport.tasks.map((task) => (
                        <div 
                          key={task.id}
                          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6"
                        >
                          <div className="space-y-4 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                task.status === 'Completed'   ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                task.status === 'In Review'   ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                task.status === 'Rejected'    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                                task.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                                'bg-slate-50 dark:bg-slate-800/50 border-slate-100 text-slate-500'
                              }`}>
                                {task.status}
                              </span>
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-lg">
                                {task.category || 'General'}
                              </span>
                              {task.was_delayed && (
                                <span className="bg-rose-100 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Delayed Completion
                                </span>
                              )}
                              {task.was_resubmitted && (
                                <span className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Resubmitted ({task.resubmit_count}x)
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">{task.title}</h4>
                              <div 
                                className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3"
                                dangerouslySetInnerHTML={{ __html: task.description || '<p class="italic text-slate-400">No description provided.</p>' }} 
                              />
                            </div>

                            {task.submission_link && (
                              <div className="pt-2">
                                <a 
                                  href={task.submission_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors"
                                >
                                  <FiLink size={13} />
                                  <span>View Submission Link</span>
                                </a>
                              </div>
                            )}

                            {task.admin_note && (
                              <div className="bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 mt-2">
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <FiXCircle />
                                  <span>Rejection Feedback / Notes:</span>
                                </p>
                                <p className="text-sm text-rose-700 dark:text-rose-400 font-medium leading-relaxed">{task.admin_note}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0 shrink-0 text-slate-400 text-xs font-bold space-y-2">
                            <div className="flex md:flex-col items-center md:items-end gap-2">
                              <span>Assigned Date:</span>
                              <span className="text-slate-700 dark:text-slate-200 text-sm">
                                {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {task.completed_at && (
                              <div className="flex md:flex-col items-center md:items-end gap-2 mt-2">
                                <span className="text-emerald-600 dark:text-emerald-400">Completed Date:</span>
                                <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                                  {new Date(task.completed_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
                        No tasks assigned during this period.
                      </div>
                    )}
                  </div>
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

    </div>
  );
};

export default Reports;
