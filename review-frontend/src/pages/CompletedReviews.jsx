import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiClock, FiCheck, FiX, FiCode, FiLink, FiChevronDown,
  FiAlertCircle, FiMessageSquare, FiSend, FiPlusCircle,
  FiSearch, FiCalendar, FiUsers, FiFileText, FiEye, FiFilter, FiCheckCircle, FiPackage, FiExternalLink, FiDownload
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import TaskDeliverablesViewer from '../components/TaskDeliverablesViewer';
import { downloadFile } from '../utils/fileDownloader';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────
const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);

const DynamicJsonViewer = ({ data, level = 0 }) => {
  if (data === null) return <span className="text-white/40 italic text-xs">null</span>;
  if (typeof data === 'boolean') return <span className={`text-xs ${data ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}`}>{data ? 'True' : 'False'}</span>;
  if (typeof data === 'number') return <span className="text-blue-400 font-medium text-xs">{data}</span>;
  if (typeof data === 'string') {
    if (isColorHex(data)) {
      return (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shadow-sm inline-block shrink-0 border border-white/10" style={{ backgroundColor: data }}></span>
          <span className="text-white/70 font-medium text-xs">{data}</span>
        </span>
      );
    }
    return <span className="text-white/70 text-xs leading-relaxed">{data}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="flex flex-col gap-1 mt-1 list-disc list-inside text-white/30 marker:text-white/20 pl-1">
        {data.map((item, idx) => (
          <li key={idx} className="text-xs">
             <span className="inline-block align-top ml-[-4px] w-[calc(100%-12px)]">
               <DynamicJsonViewer data={item} level={level + 1} />
             </span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className={`flex flex-col gap-2 ${level > 0 ? 'mt-1.5 pl-3 border-l-2 border-white/5' : ''}`}>
        {Object.entries(data).map(([key, val]) => {
          const isComplex = typeof val === 'object' && val !== null;
          return (
            <div key={key} className={`flex ${isComplex ? 'flex-col' : 'items-start gap-3'}`}>
              <span className={`text-[10px] font-bold text-white/40 uppercase shrink-0 ${!isComplex ? 'w-1/3 min-w-[120px] max-w-[150px] pt-0.5' : 'mb-0.5 text-white/70'}`}>
                {key.replace(/_/g, ' ')}
              </span>
              <div className={`${isComplex ? 'w-full' : 'flex-1 break-words'}`}>
                <DynamicJsonViewer data={val} level={level + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const DescriptionRenderer = ({ htmlContent }) => {
  let jsonData = null;
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    rawText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (rawText.startsWith('{') || rawText.startsWith('[')) {
      jsonData = JSON.parse(rawText);
    }
  } catch (e) {
    jsonData = null;
  }

  if (jsonData) {
    return (
      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[11px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiCode size={14} />
            Structured Specifications (JSON)
          </h4>
        </div>
        <DynamicJsonViewer data={jsonData} />
      </div>
    );
  }

  return (
    <div
      className="text-white/70 text-xs leading-relaxed max-w-none task-description-html"
      dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="italic text-white/30">No description provided.</p>' }}
    />
  );
};

const fmtRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const formattedStr = dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(formattedStr);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
};

const fmtLogTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-GB', { 
    timeZone: 'Asia/Dhaka', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  }).toUpperCase();
};

const TaskTimeline = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-xs text-white/40">
        <div className="w-3.5 h-3.5 border border-white/20 border-t-transparent rounded-full animate-spin" />
        <span>Loading logs...</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return null;
  }

  const cronLogs = [...logs].reverse();

  return (
    <div className="space-y-3">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Task History Logs</h4>
      
      <div className="relative pl-5 border-l border-white/5 space-y-5 ml-1 pt-1 pb-1">
        {cronLogs.map((log) => {
          const isCreation = !log.status_from;
          const statusText = isCreation
            ? "Task Created & Assigned"
            : `Status changed to: ${log.status_to}`;
          const actor = log.changed_by_name || 'ADMIN';
          const timeText = fmtLogTime(log.created_at);

          return (
            <div key={log.id} className="relative">
              <span className="absolute left-0 -translate-x-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-dark-900 block" />
              
              <div>
                <p className="text-white text-xs font-bold leading-tight">{statusText}</p>
                <p className="text-white/40 text-[9px] uppercase font-semibold tracking-wide mt-1">
                  BY {actor} <span className="text-white/20 px-1">•</span> {timeText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Image & Resource Renderers ───────────────────────────────────────────────
const RefImagesRenderer = ({ imagesJson }) => {
  if (!imagesJson) return null;
  
  let imageList = [];
  try {
    if (typeof imagesJson === 'string' && (imagesJson.trim().startsWith('[') || imagesJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed)) {
        imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
      }
    } else if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  } catch (e) {
    if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  }

  if (imageList.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Images / Mockups</h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <a 
            key={idx} 
            href={`${API_BASE}${img}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:scale-105 shrink-0 block bg-white/5"
          >
            <img src={`${API_BASE}${img}`} className="w-full h-full object-cover" alt={`Ref ${idx + 1}`} />
          </a>
        ))}
      </div>
    </div>
  );
};

const VisualWorkImageRenderer = ({ imgPath }) => {
  if (!imgPath) return null;

  let imageList = [];
  try {
    if (typeof imgPath === 'string' && (imgPath.trim().startsWith('[') || imgPath.trim().startsWith('{'))) {
      const parsed = JSON.parse(imgPath);
      if (Array.isArray(parsed)) {
        imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
      }
    } else if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
  } catch (e) {
    if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
  }

  if (imageList.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-emerald-400/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        Staff Uploaded Work Image
      </h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <div key={idx} className="max-w-md rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg bg-white/5">
            <a href={`${API_BASE}${img}`} target="_blank" rel="noopener noreferrer">
              <img src={`${API_BASE}${img}`} className="w-full max-h-72 object-contain hover:opacity-90 transition-opacity" alt={`Staff Work ${idx + 1}`} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

const RefLinksRenderer = ({ linksJson }) => {
  if (!linksJson) return null;
  
  let linkList = [];
  try {
    if (typeof linksJson === 'string' && (linksJson.trim().startsWith('[') || linksJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(linksJson);
      if (Array.isArray(parsed)) {
        linkList = parsed.filter(lnk => typeof lnk === 'string' && lnk.trim() !== '');
      }
    } else if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  } catch (e) {
    if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  }

  if (linkList.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Resources & Links</h4>
      <div className="flex flex-col gap-1.5 pl-1">
        {linkList.map((lnk, idx) => (
          <a 
            key={idx} 
            href={lnk} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1.5"
          >
            <FiLink size={12} /> {lnk}
          </a>
        ))}
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────────────────────────────
const CompletedReviews = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeReviewTask, setActiveReviewTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [modalTab, setModalTab] = useState('submission'); // 'submission' | 'instructions'
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchCompleted = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/reviewer/get_completed_reviews.php?reviewer_user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        setTasks(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, [currentUser]);

  // Extract unique staff names
  const staffList = useMemo(() => {
    const names = {};
    tasks.forEach(t => {
      if (t.staff_name) names[t.staff_name] = true;
    });
    return Object.keys(names);
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = searchQuery.trim() === '' || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.priority || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStaff = selectedStaff === '' || t.staff_name === selectedStaff;
      
      let matchDate = true;
      if (selectedDate !== '') {
        const taskDatePart = t.submitted_at ? t.submitted_at.split(' ')[0] : '';
        matchDate = taskDatePart === selectedDate;
      }

      return matchSearch && matchStaff && matchDate;
    });
  }, [tasks, searchQuery, selectedStaff, selectedDate]);

  const selectTaskForReview = async (task) => {
    setActiveReviewTask(task);
    const taskId = task.task_id;

    if (!taskLogs[taskId]) {
      setLoadingLogs(prev => ({ ...prev, [taskId]: true }));
      try {
        const res = await axios.get(`${API_BASE}api/admin/tasks/get_task_logs.php?task_id=${taskId}`);
        if (res.data.status === 'success') {
          setTaskLogs(prev => ({ ...prev, [taskId]: res.data.data || [] }));
        }
      } catch (e) {
        console.error("Failed to load logs for task " + taskId, e);
      } finally {
        setLoadingLogs(prev => ({ ...prev, [taskId]: false }));
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiCheckCircle className="text-emerald-400" /> Completed Reviews
        </h1>
        <p className="text-white/40 text-sm mt-1">Review task history and completed items</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by title or priority…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
          />
        </div>

        {/* Staff dropdown */}
        <div className="relative w-full md:w-56">
          <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-8 py-2.5 text-xs outline-none focus:border-brand-500/50 appearance-none transition-all cursor-pointer"
          >
            <option value="" className="bg-dark-900 text-white">All Staff Members</option>
            {staffList.map(name => (
              <option key={name} value={name} className="bg-dark-900 text-white">{name}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-48">
          <FiCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all cursor-pointer"
          />
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedStaff || selectedDate) && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedStaff(''); setSelectedDate(''); }}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <FiFileText className="mx-auto text-white/20 w-12 h-12 mb-3" />
          <h2 className="text-white font-bold text-lg">No completed reviews found</h2>
          <p className="text-white/40 text-sm mt-1">
            {tasks.length === 0 ? "You haven't approved any tasks yet." : "No completed tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(t => {
            return (
              <div
                key={t.task_id}
                onClick={() => selectTaskForReview(t)}
                className="glass rounded-2xl p-5 border border-white/5 hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px] relative group"
              >
                <div>
                  {/* Top row: Profile & Priority */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-white/10">
                        {t.staff_avatar
                          ? <img src={`${API_BASE}${t.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                          : <span className="w-full h-full flex items-center justify-center font-bold text-xs text-brand-400 bg-white/5">{t.staff_name?.[0]}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate leading-tight">{t.staff_name}</p>
                        <p className="text-white/30 text-[10px] truncate leading-none mt-0.5">{t.department_name || 'CCA Academy'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <span className="px-2 py-0.5 rounded-full border text-[9px] font-semibold text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                        Completed
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold shrink-0 ${
                        t.priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                        : t.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                        : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                      }`}>{t.priority}</span>
                    </div>
                  </div>

                  {/* Task title */}
                  <h3 className="text-white/90 font-bold text-sm leading-snug line-clamp-2 mt-2 group-hover:text-emerald-400 transition-colors">
                    {t.title}
                  </h3>
                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-white/30">
                  <span>Approved {fmtRelativeTime(t.reviewed_at)}</span>
                  <span className="text-brand-400 font-semibold group-hover:underline flex items-center gap-1">
                    Details <FiEye size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Completed Review Overlay Modal (Identical to PendingReviews layout) */}
      {activeReviewTask && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setActiveReviewTask(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 glass rounded-3xl border border-white/5 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4 bg-dark-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-white/10">
                  {activeReviewTask.staff_avatar
                    ? <img src={`${API_BASE}${activeReviewTask.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-white/50">{activeReviewTask.staff_name?.[0]}</span>
                  }
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm leading-tight">{activeReviewTask.staff_name}</h2>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    {activeReviewTask.department_name} • Approved {fmtRelativeTime(activeReviewTask.reviewed_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                  activeReviewTask.priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                  : activeReviewTask.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                  : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                }`}>{activeReviewTask.priority} Priority</span>
                
                <button
                  onClick={() => setActiveReviewTask(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              {/* Task Title & Tabs Header */}
              <div className="space-y-4">
                <h1 className="text-white font-bold text-xl leading-snug">{activeReviewTask.title}</h1>

                {/* 2-Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <button
                    type="button"
                    onClick={() => setModalTab('submission')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      modalTab === 'submission'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FiPackage size={14} className={modalTab === 'submission' ? 'text-emerald-400' : 'text-white/40'} />
                    <span>Submitted Deliverables</span>
                    {activeReviewTask.submissions && activeReviewTask.submissions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200">
                        {activeReviewTask.submissions.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('instructions')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      modalTab === 'instructions'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm shadow-brand-500/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FiFileText size={14} className={modalTab === 'instructions' ? 'text-brand-400' : 'text-white/40'} />
                    <span>Task Brief & Instructions</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (2/3 width): Active Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                  {modalTab === 'submission' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* 🌟 Reviewer Final Stock-Ready Production Delivery */}
                      {(activeReviewTask.final_file_url || activeReviewTask.final_image_url) && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-dark-900 border border-blue-500/30 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                                <HiSparkles size={18} className="text-amber-300" />
                              </span>
                              <div>
                                <h3 className="text-white font-black text-sm flex items-center gap-2">
                                  Reviewer Corrected Stock Version
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold">
                                    Stock-Ready
                                  </span>
                                </h3>
                                <p className="text-white/40 text-[10px]">
                                  Corrected by {activeReviewTask.reviewed_by_name || 'Reviewer'} • Ready for Stock Upload
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {activeReviewTask.final_image_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_image_url.startsWith('http')
                                      ? activeReviewTask.final_image_url
                                      : `${API_BASE}${activeReviewTask.final_image_url}`;
                                    downloadFile(url, `${activeReviewTask.task_id}_preview.jpg`);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                                >
                                  <FiDownload size={13} /> Download Preview JPG
                                </button>
                              )}

                              {activeReviewTask.final_file_url && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_file_url.startsWith('http')
                                      ? activeReviewTask.final_file_url
                                      : `${API_BASE}${activeReviewTask.final_file_url}`;
                                    downloadFile(url);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-950/50"
                                >
                                  <FiDownload size={14} /> Download Final Stock File
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Fix notes */}
                          {activeReviewTask.fix_notes && (
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
                              <span className="text-white/40 font-bold uppercase text-[10px] block mb-0.5">Correction Remarks:</span>
                              {activeReviewTask.fix_notes}
                            </div>
                          )}

                          {/* Final image preview */}
                          {activeReviewTask.final_image_url && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-white/40 font-bold uppercase text-[10px]">Final Stock Preview Image</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = activeReviewTask.final_image_url.startsWith('http')
                                      ? activeReviewTask.final_image_url
                                      : `${API_BASE}${activeReviewTask.final_image_url}`;
                                    downloadFile(url, `${activeReviewTask.task_id}_preview.jpg`);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 hover:underline"
                                >
                                  <FiDownload size={12} /> Download Image
                                </button>
                              </div>
                              <div className="max-w-md rounded-xl overflow-hidden border border-blue-500/20 bg-black/40">
                                <img 
                                  src={activeReviewTask.final_image_url.startsWith('http') ? activeReviewTask.final_image_url : `${API_BASE}${activeReviewTask.final_image_url}`} 
                                  className="w-full max-h-72 object-contain hover:opacity-90 transition-opacity cursor-pointer" 
                                  alt="Final Stock Preview"
                                  onClick={() => setSelectedImage(activeReviewTask.final_image_url.startsWith('http') ? activeReviewTask.final_image_url : `${API_BASE}${activeReviewTask.final_image_url}`)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Task Deliverables (Cloudflare R2 Direct Submissions + Links) */}
                      <div className="space-y-2">
                        {(activeReviewTask.final_file_url || activeReviewTask.final_image_url) && (
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">
                            Staff Original Submission (Preserved History)
                          </p>
                        )}
                        <TaskDeliverablesViewer 
                          submissions={activeReviewTask.submissions} 
                          submissionLink={activeReviewTask.submission_link}
                          totalTimeSpent={activeReviewTask.total_time_spent}
                          submittedAt={activeReviewTask.submitted_at}
                          onImageClick={(url) => setSelectedImage(url)}
                        />
                      </div>

                      {/* Legacy Staff Uploaded Work Image */}
                      <VisualWorkImageRenderer imgPath={activeReviewTask.visual_image} />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                        <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FiFileText className="text-brand-400" size={14} /> Full Description & Specifications
                        </h4>
                        <DescriptionRenderer htmlContent={activeReviewTask.description} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column (1/3 width): References & Checklist */}
                <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6">
                  
                  {/* Checklists (Sub tasks) */}
                  {activeReviewTask.checklists && Array.isArray(activeReviewTask.checklists) && activeReviewTask.checklists.length > 0 && (
                    <div>
                      <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Checklist Status</h4>
                      <div className="flex flex-col gap-2 pl-1">
                        {activeReviewTask.checklists.map((item, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2 text-xs text-white/60">
                            <input
                              type="checkbox"
                              checked={item.is_completed}
                              readOnly
                              className="rounded border-white/10 bg-white/5 text-brand-500 focus:ring-0 cursor-default"
                            />
                            <span className={item.is_completed ? 'line-through text-white/30' : ''}>{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reference Images */}
                  <RefImagesRenderer imagesJson={activeReviewTask.ref_image} />

                  {/* Reference Links */}
                  <RefLinksRenderer linksJson={activeReviewTask.ref_links} />

                  {/* Task History Logs */}
                  <TaskTimeline logs={taskLogs[activeReviewTask.task_id]} loading={loadingLogs[activeReviewTask.task_id]} />
                </div>
              </div>
            </div>

            {/* Modal Footer (Sticky Bottom Action Bar) */}
            <div className="p-5 border-t border-white/5 bg-dark-900/90 backdrop-blur-md flex items-center justify-center gap-3 rounded-b-3xl">
              <div className="w-full max-w-md bg-emerald-500/10 border border-emerald-500/20 py-3 px-5 rounded-2xl flex items-center justify-center gap-2.5">
                <FiCheckCircle className="text-emerald-400 shrink-0" size={16} />
                <span className="text-white text-xs font-semibold">
                  Approved by{' '}
                  <span className="text-emerald-400 font-bold">
                    {activeReviewTask.reviewed_by_name || 'Reviewer'}
                  </span>{' '}
                  {activeReviewTask.reviewed_at ? fmtRelativeTime(activeReviewTask.reviewed_at) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Close Lightbox (Esc)"
          >
            <FiX size={24} />
          </button>
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center select-none" 
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged Preview"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            <div className="mt-4 flex items-center gap-3">
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <FiExternalLink size={14} /> Open in New Tab
              </a>
              <a
                href={selectedImage}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                <FiDownload size={14} /> Download Original
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CompletedReviews;
