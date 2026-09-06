import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiX, FiCode, FiLink, FiChevronDown, FiAlertCircle,
  FiMessageSquare, FiSearch, FiCalendar, FiUsers,
  FiFileText, FiEye, FiFilter, FiImage, FiMaximize, FiMinimize, FiPackage, FiExternalLink, FiDownload
} from 'react-icons/fi';
import TaskTimeline from '../components/TaskTimeline';
import TaskDeliverablesViewer from '../components/TaskDeliverablesViewer';
import AgenticBlueprintViewer from '../components/AgenticBlueprintViewer';
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
            <FiCode size={14} /> Structured Specifications (JSON)
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
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
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

// ── Image & Resource Renderers ───────────────────────────────────────────────
const RefImagesRenderer = ({ imagesJson }) => {
  if (!imagesJson) return null;
  let imageList = [];
  try {
    if (typeof imagesJson === 'string' && (imagesJson.trim().startsWith('[') || imagesJson.trim().startsWith('{'))) {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed)) imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') {
      imageList = [imagesJson.trim()];
    }
  } catch (e) {
    if (typeof imagesJson === 'string' && imagesJson.trim() !== '' && imagesJson.trim() !== 'null' && imagesJson.trim() !== '[]') imageList = [imagesJson.trim()];
  }
  if (imageList.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Images / Mockups</h4>
      <div className="flex flex-wrap gap-3">
        {imageList.map((img, idx) => (
          <a key={idx} href={`${API_BASE}${img}`} target="_blank" rel="noopener noreferrer"
            className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:scale-105 shrink-0 block bg-white/5">
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
      if (Array.isArray(parsed)) imageList = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') {
      imageList = [imgPath.trim()];
    }
  } catch (e) {
    if (typeof imgPath === 'string' && imgPath.trim() !== '' && imgPath.trim() !== 'null' && imgPath.trim() !== '[]') imageList = [imgPath.trim()];
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
      if (Array.isArray(parsed)) linkList = parsed.filter(lnk => typeof lnk === 'string' && lnk.trim() !== '');
    } else if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') {
      linkList = [linksJson.trim()];
    }
  } catch (e) {
    if (typeof linksJson === 'string' && linksJson.trim() !== '' && linksJson.trim() !== 'null' && linksJson.trim() !== '[]') linkList = [linksJson.trim()];
  }
  if (linkList.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Reference Resources & Links</h4>
      <div className="flex flex-col gap-1.5 pl-1">
        {linkList.map((lnk, idx) => (
          <a key={idx} href={lnk} target="_blank" rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1.5">
            <FiLink size={12} /> {lnk}
          </a>
        ))}
      </div>
    </div>
  );
};

// ── Rejection Screenshot Renderer ─────────────────────────────────────────
const RejectionImageRenderer = ({ imgPath }) => {
  if (!imgPath || imgPath.trim() === '' || imgPath.trim() === 'null') return null;
  return (
    <div className="space-y-2">
      <h4 className="text-red-400/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
        <FiImage size={12} /> Reviewer Screenshot / Annotation
      </h4>
      <div className="rounded-xl overflow-hidden border border-red-500/25 bg-red-500/5 max-w-md">
        <a href={`${API_BASE}${imgPath}`} target="_blank" rel="noopener noreferrer">
          <img
            src={`${API_BASE}${imgPath}`}
            className="w-full max-h-64 object-contain hover:opacity-90 transition-opacity"
            alt="Rejection Screenshot"
          />
        </a>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const RejectedReviews = () => {
  const { currentUser } = useAuth();
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [taskLogs,   setTaskLogs]   = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [zenMode,    setZenMode]    = useState(false);

  // Filters
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedStaff,  setSelectedStaff]  = useState('');
  const [selectedDate,   setSelectedDate]   = useState('');
  const [sortOrder,      setSortOrder]      = useState('newest');
  const [modalTab,       setModalTab]       = useState('submission'); // 'submission' | 'instructions'
  const [selectedImage,  setSelectedImage]  = useState(null);

  const fetchRejected = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}api/reviewer/get_rejected_reviews.php?reviewer_user_id=${currentUser.id}`
      );
      if (res.data.status === 'success') setTasks(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRejected(); }, [currentUser]);

  // Keyboard ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (activeTask && e.key === 'Escape') { setActiveTask(null); setZenMode(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTask]);

  const staffList = useMemo(() => {
    const names = {};
    tasks.forEach(t => { if (t.staff_name) names[t.staff_name] = true; });
    return Object.keys(names);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchSearch = searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.priority || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStaff = selectedStaff === '' || t.staff_name === selectedStaff;
      let matchDate = true;
      if (selectedDate !== '') {
        const taskDatePart = t.rejected_at ? t.rejected_at.split(' ')[0] : '';
        matchDate = taskDatePart === selectedDate;
      }
      return matchSearch && matchStaff && matchDate;
    });

    result.sort((a, b) => {
      const timeA = new Date((a.rejected_at || '').replace(' ', 'T') + 'Z').getTime();
      const timeB = new Date((b.rejected_at || '').replace(' ', 'T') + 'Z').getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [tasks, searchQuery, selectedStaff, selectedDate, sortOrder]);

  const openTask = async (task) => {
    setActiveTask(task);
    const taskId = task.task_id;
    if (!taskLogs[taskId]) {
      setLoadingLogs(prev => ({ ...prev, [taskId]: true }));
      try {
        const res = await axios.get(`${API_BASE}api/admin/tasks/get_task_logs.php?task_id=${taskId}`);
        if (res.data.status === 'success') setTaskLogs(prev => ({ ...prev, [taskId]: res.data.data || [] }));
      } catch (e) { console.error(e); }
      finally { setLoadingLogs(prev => ({ ...prev, [taskId]: false })); }
    }
  };

  if (loading) return (
    <div className="mx-auto space-y-6 animate-pulse p-2">
      <div className="h-10 bg-white/5 rounded-xl w-1/4 mb-4"></div>
      <div className="h-16 bg-white/5 rounded-2xl w-full mb-6"></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-44 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiX className="text-red-400 bg-red-500/10 p-1 rounded-lg" size={28} />
          Rejected Submissions
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Tasks you sent back for revision. Staff must fix and resubmit these.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 border border-red-500/15 bg-gradient-to-br from-red-500/5 to-transparent">
          <p className="text-red-400 text-3xl font-black">{tasks.length}</p>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Total Rejected</p>
        </div>
        {['High','Medium','Low'].map(p => (
          <div key={p} className="glass rounded-2xl p-4 border border-white/5">
            <p className={`text-3xl font-black ${p === 'High' ? 'text-red-400' : p === 'Medium' ? 'text-yellow-400' : 'text-slate-400'}`}>
              {tasks.filter(t => t.priority === p).length}
            </p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">{p} Priority</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by title, staff or priority..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-red-500/40 transition-all"
          />
        </div>

        {/* Staff Filter */}
        <div className="relative w-full md:w-56">
          <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-red-500/40 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="">All Staff Members</option>
            {staffList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <FiChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-52">
          <FiCalendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-red-500/40 transition-all cursor-pointer font-medium"
          />
        </div>

        {/* Sort */}
        <div className="relative w-full md:w-44">
          <FiFilter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-red-500/40 appearance-none transition-all cursor-pointer font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Clear */}
        {(searchQuery || selectedStaff || selectedDate || sortOrder !== 'newest') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedStaff(''); setSelectedDate(''); setSortOrder('newest'); }}
            className="w-full md:w-auto shrink-0 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <FiFileText className="mx-auto text-white/20 w-12 h-12 mb-3" />
          <h2 className="text-white font-bold text-lg">No rejected submissions</h2>
          <p className="text-white/40 text-sm mt-1">
            {tasks.length === 0 ? "Great! You haven't rejected any tasks." : "No rejected tasks match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((t, index) => (
            <div
              key={t.task_id}
              onClick={() => openTask(t)}
              className="glass rounded-2xl p-5 border border-red-500/10 hover:border-red-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[180px] relative group bg-gradient-to-br from-red-500/[0.03] to-transparent"
            >
              {/* Rejected badge */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full border text-[9px] font-bold text-red-400 border-red-500/30 bg-red-500/10">
                  Rejected
                </span>
              </div>

              <div>
                {/* Top row: Avatar + Priority */}
                <div className="flex items-center gap-2.5 mb-3 pr-16">
                  <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-red-500/20">
                    {t.staff_avatar
                      ? <img src={`${API_BASE}${t.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                      : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-red-400">{t.staff_name?.[0]}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate leading-tight">{t.staff_name}</p>
                    <p className="text-white/40 text-[9px] truncate mt-0.5">{t.department_name}</p>
                  </div>
                </div>

                {/* Task title */}
                <h3 className="text-white font-semibold text-sm line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                  {t.title}
                </h3>

                {/* Rejection reason preview */}
                {t.rejection_reason && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <FiMessageSquare size={11} className="text-red-400/60 mt-0.5 flex-shrink-0" />
                    <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{t.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-red-500/10 pt-3 mt-4 text-[10px]">
                <span className="text-white/35 flex items-center gap-1">
                  <FiCalendar size={11} /> {fmtRelativeTime(t.rejected_at)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${
                    t.priority === 'High'   ? 'text-red-400 border-red-500/30 bg-red-500/5'
                    : t.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                    : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                  }`}>{t.priority}</span>
                  <span className="text-red-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform border-l border-white/10 pl-2">
                    Inspect <FiEye size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {activeTask && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center animate-fade-in ${zenMode ? 'p-0' : 'p-4 lg:p-6'}`}>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 transition-colors duration-500 ${zenMode ? 'bg-dark-950' : 'bg-black/75 backdrop-blur-md'}`}
            onClick={() => { setActiveTask(null); setZenMode(false); }}
          />

          {/* Modal */}
          <div className={`relative z-10 glass border border-red-500/20 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
            zenMode ? 'w-screen h-screen rounded-none border-0' : 'rounded-3xl w-full max-w-6xl h-[90vh] max-h-[90vh]'
          }`}>

            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between gap-4 bg-red-950/20 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-red-500/20">
                  {activeTask.staff_avatar
                    ? <img src={`${API_BASE}${activeTask.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-red-400">{activeTask.staff_name?.[0]}</span>
                  }
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm leading-tight">{activeTask.staff_name}</h2>
                  <p className="text-white/40 text-[10px] mt-0.5 flex items-center gap-1.5">
                    {activeTask.department_name}
                    <span className="text-red-400/50">•</span>
                    <span className="text-red-400/70 font-semibold">Rejected {fmtRelativeTime(activeTask.rejected_at)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                  activeTask.priority === 'High'   ? 'text-red-400 border-red-500/30 bg-red-500/5'
                  : activeTask.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                  : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                }`}>{activeTask.priority} Priority</span>

                <button
                  onClick={() => setZenMode(!zenMode)}
                  className="text-white/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                  title="Toggle Zen Mode"
                >
                  {zenMode ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                </button>

                <button
                  onClick={() => { setActiveTask(null); setZenMode(false); }}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6 overscroll-contain">
              {/* Task Title */}
              <div>
                <h1 className="text-white font-bold text-lg leading-snug">{activeTask.title}</h1>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                  <FiX size={12} /> Rejected Submission
                </span>
              </div>

              {/* ── Rejection Reason BOX (highlighted) ── */}
              {activeTask.rejection_reason && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-5 space-y-3">
                  <h3 className="text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <FiMessageSquare size={14} /> Rejection Reason / Feedback
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{activeTask.rejection_reason}</p>
                  {/* Rejection Screenshot */}
                  {activeTask.rejection_image && (
                    <RejectionImageRenderer imgPath={activeTask.rejection_image} />
                  )}
                </div>
              )}

              {/* 2-Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setModalTab('submission')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    modalTab === 'submission'
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FiPackage size={14} className={modalTab === 'submission' ? 'text-emerald-600 dark:text-emerald-400' : 'text-white/40'} />
                  <span>Submitted Deliverables</span>
                  {activeTask.submissions && activeTask.submissions.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-900 dark:text-emerald-200">
                      {activeTask.submissions.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('instructions')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    modalTab === 'instructions'
                      ? 'bg-brand-500/15 text-brand-800 dark:text-brand-300 border border-brand-500/40 shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FiFileText size={14} className={modalTab === 'instructions' ? 'text-brand-600 dark:text-brand-400' : 'text-white/40'} />
                  <span>Task Brief & Instructions</span>
                </button>
              </div>

              {/* 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Active Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                  {modalTab === 'submission' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Task Deliverables (Cloudflare R2 Direct Submissions + Links) */}
                      <TaskDeliverablesViewer 
                        submissions={activeTask.submissions} 
                        submissionLink={activeTask.submission_link}
                        totalTimeSpent={activeTask.total_time_spent}
                        submittedAt={activeTask.submitted_at}
                        onImageClick={(url) => setSelectedImage(url)}
                      />

                      {/* Legacy Staff Work Image */}
                      <VisualWorkImageRenderer imgPath={activeTask.visual_image} />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {activeTask.blueprint_variants && activeTask.blueprint_variants.length > 0 ? (
                        <AgenticBlueprintViewer variants={activeTask.blueprint_variants} />
                      ) : (
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                          <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiFileText className="text-brand-400" size={14} /> Full Description & Specifications
                          </h4>
                          <DescriptionRenderer htmlContent={activeTask.description} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Checklist, Ref Images, Links, Logs */}
                <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-6">

                  {/* Checklist */}
                  {activeTask.checklists && Array.isArray(activeTask.checklists) && activeTask.checklists.length > 0 && (
                    <div>
                      <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Checklist Status</h4>
                      <div className="flex flex-col gap-2 pl-1">
                        {activeTask.checklists.map((item, cIdx) => (
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
                  <RefImagesRenderer imagesJson={activeTask.ref_image} />

                  {/* Reference Links */}
                  <RefLinksRenderer linksJson={activeTask.ref_links} />

                  {/* Task Timeline Logs */}
                  <TaskTimeline
                    logs={taskLogs[activeTask.task_id]}
                    loading={loadingLogs[activeTask.task_id]}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/5 bg-red-950/20 backdrop-blur-md flex items-center justify-center gap-3 rounded-b-3xl">
              <div className="w-full max-w-lg bg-red-500/10 border border-red-500/20 py-3 px-5 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <FiX className="text-red-400 shrink-0" size={16} />
                  <span className="text-white text-xs font-semibold">
                    Rejected by{' '}
                    <span className="text-red-400 font-bold">{activeTask.reviewed_by_name || 'Reviewer'}</span>
                    {' '}{activeTask.rejected_at ? fmtRelativeTime(activeTask.rejected_at) : ''}
                  </span>
                </div>
                <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
                  Awaiting Resubmission
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
              <button
                type="button"
                onClick={() => downloadFile(selectedImage)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                <FiDownload size={14} /> Download Original
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RejectedReviews;
