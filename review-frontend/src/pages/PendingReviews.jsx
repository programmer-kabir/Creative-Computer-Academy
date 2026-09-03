import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  FiClock, FiSearch, FiFilter, FiCheck, FiX, FiUsers,
  FiChevronDown, FiCalendar, FiEye, FiLink, FiDownload,
  FiImage, FiMaximize, FiMinimize, FiCode, FiMessageSquare,
  FiSend, FiPlusCircle, FiAlertCircle, FiFileText, FiPackage, FiExternalLink,
  FiStar, FiTag
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import TaskTimeline from '../components/TaskTimeline';
import TaskDeliverablesViewer from '../components/TaskDeliverablesViewer';
import ApprovalRatingModal from '../components/ApprovalRatingModal';
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
  // The database returns the timestamp in UTC. Append 'Z' to parse it correctly as UTC.
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

const DELIVERY_STAR_LABELS = {
  1: { label: 'Needs Improvement', desc: 'Minimal acceptable quality, several flaws', color: 'text-amber-500' },
  2: { label: 'Below Average', desc: 'Acceptable with minor issues or corrections', color: 'text-amber-500 dark:text-amber-400' },
  3: { label: 'Good', desc: 'Meets requirements and quality standards', color: 'text-yellow-600 dark:text-yellow-400' },
  4: { label: 'Very Good', desc: 'High quality, well structured and polished', color: 'text-emerald-600 dark:text-emerald-400' },
  5: { label: 'Outstanding!', desc: 'Exceptional, flawless execution and creative', color: 'text-indigo-600 dark:text-brand-400' }
};

const DELIVERY_SUGGESTED_TAGS = [
  '⚡ Fast Delivery',
  '🎯 High Accuracy',
  '🎨 Creative Design',
  '🧹 Clean Layers & Files',
  '💡 Followed Instructions',
  '✨ Great Typography',
  '🔥 Pixel Perfect'
];

// ── Main Page Component ──────────────────────────────────────────────────────
const PendingReviews = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewTask, setActiveReviewTask] = useState(null); // Selected task for modal details
  const [actionLoading, setActionLoading] = useState({});
  const [taskLogs, setTaskLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectScreenshot, setRejectScreenshot] = useState(null);
  const [rejectScreenshotPreview, setRejectScreenshotPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ratingModalTask, setRatingModalTask] = useState(null);

  // Reviewer Final Stock Delivery States
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryTask, setDeliveryTask] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [finalFileLink, setFinalFileLink] = useState('');
  const [finalImage, setFinalImage] = useState(null);
  const [finalImagePreview, setFinalImagePreview] = useState(null);
  const [fixNotes, setFixNotes] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [isDraggingFinal, setIsDraggingFinal] = useState(false);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryHoverRating, setDeliveryHoverRating] = useState(0);
  const [deliveryIncludeRating, setDeliveryIncludeRating] = useState(true);
  const [deliverySelectedTags, setDeliverySelectedTags] = useState(['⚡ Fast Delivery', '🎯 High Accuracy']);

  const smartMacros = [
    { icon: '🔤', label: "Spelling / Typos", text: "There are spelling or grammatical mistakes in the text copy. Please proofread carefully and fix all typos." },
    { icon: '📐', label: "Wrong Dimensions / DPI", text: "Canvas dimensions, aspect ratio, or DPI resolution do not match the required specifications. Please correct the sizing (300 DPI for print, 72-150 DPI for web)." },
    { icon: '📏', label: "Alignment & Spacing", text: "Please fix the alignment, padding, and spacing issues across the layout. Ensure margins, grids, and elements are balanced." },
    { icon: '🎨', label: "Color / Contrast", text: "Color harmony or contrast is too low on key elements. Please adjust colors to improve readability and visual hierarchy." },
    { icon: '📁', label: "Missing Files / Assets", text: "Requested source files (PSD/AI/EPS/Fonts) or assets are missing from the submission. Please attach all required deliverables." },
    { icon: '🖼️', label: "Low Quality / Blurry", text: "Images or graphical elements appear low resolution or pixelated. Please replace them with crisp, high-resolution vector/raw assets." },
    { icon: '🏷️', label: "Logo & Brand Rules", text: "Brand guidelines or logo usage rules are not followed (safe clear space, aspect ratio distortion, or incorrect colors). Please adhere to brand specs." },
    { icon: '✂️', label: "Bleed & Safe Area", text: "Print bleed margins (0.125\") or inner safe area cut-lines are missing/incorrect. Please ensure proper bleed and safe margins." },
    { icon: '📱', label: "Responsive Issue", text: "The layout breaks on mobile/tablet viewports. Please test and ensure it is fully responsive across all device sizes." },
    { icon: '📋', label: "Incomplete Checklist", text: "Some specific requirements or checklist deliverables from the task instructions were not fulfilled. Please review the checklist." },
  ];

  const [selectedTasks, setSelectedTasks] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const [zenMode, setZenMode] = useState(false);
  const [modalTab, setModalTab] = useState('submission'); // 'submission' | 'instructions'
  const [selectedImage, setSelectedImage] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/reviewer/get_pending_reviews.php?reviewer_user_id=${currentUser.id}`);
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
    fetchPending();
  }, [currentUser]);

  // Handle Paste for Screenshot & Final Delivery Image
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      if (deliveryModalOpen) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              setFinalImage(blob);
              setFinalImagePreview(URL.createObjectURL(blob));
            }
            break;
          }
        }
        return;
      }

      if (rejectModalOpen) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              setRejectScreenshot(blob);
              setRejectScreenshotPreview(URL.createObjectURL(blob));
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [rejectModalOpen, deliveryModalOpen]);

  // Keyboard Shortcuts for Active Task Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (deliveryModalOpen) {
        if (e.key === 'Escape') {
          setDeliveryModalOpen(false);
          setDeliveryTask(null);
        }
      } else if (rejectModalOpen) {
        if (e.key === 'Escape') {
          setRejectModalOpen(false);
          setRejectTaskId(null);
        }
      } else if (activeReviewTask) {
        if (e.key === 'Escape') {
          setActiveReviewTask(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReviewTask, rejectModalOpen, deliveryModalOpen]);

  // Extract unique staff names from pending tasks for dropdown filtering
  const staffList = useMemo(() => {
    const names = {};
    tasks.forEach(t => {
      if (t.staff_name) names[t.staff_name] = true;
    });
    return Object.keys(names);
  }, [tasks]);

  // Filter tasks based on Search, Staff Dropdown, and Date Selector
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
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

    // Sort the result
    result.sort((a, b) => {
      const timeA = new Date(a.submitted_at.replace(' ', 'T') + 'Z').getTime();
      const timeB = new Date(b.submitted_at.replace(' ', 'T') + 'Z').getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [tasks, searchQuery, selectedStaff, selectedDate, sortOrder]);

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

  const advanceToNextTask = (currentTaskId) => {
    const currentIndex = filteredTasks.findIndex(t => t.task_id === currentTaskId);
    if (currentIndex >= 0 && currentIndex < filteredTasks.length - 1) {
      const nextTask = filteredTasks[currentIndex + 1];
      selectTaskForReview(nextTask);
    } else {
      setActiveReviewTask(null);
    }
  };

  // Status updates: Approve (Completed)
  const handleStatusUpdate = async (taskId, newStatus, ratingData = null) => {
    // Optimistic UI Update: Remove card immediately
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.task_id !== taskId));

    if (newStatus === 'Completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34d399', '#10b981', '#059669', '#047857'] // Emerald colors
      });
    }

    if (activeReviewTask && activeReviewTask.task_id === taskId) {
      advanceToNextTask(taskId);
    }

    try {
      const payload = {
        task_id: taskId,
        status: newStatus,
        changed_by: currentUser.id
      };
      if (ratingData) {
        if (ratingData.rating) payload.rating = ratingData.rating;
        if (ratingData.feedback_notes) payload.feedback_notes = ratingData.feedback_notes;
        if (ratingData.tags) payload.tags = ratingData.tags;
      }

      axios.post(`${API_BASE}api/reviewer/update_task_status.php`, payload).then(res => {
        if (res.data.status !== 'success') {
          console.error(res.data);
          alert('Failed to update task status. Reverting changes.');
          setTasks(previousTasks);
        }
      }).catch(e => {
        console.error(e);
        alert('Failed to update task status. Reverting changes.');
        setTasks(previousTasks);
      });
    } catch (e) {
      console.error(e);
      setTasks(previousTasks);
    }
  };

  const triggerReject = (taskId) => {
    setRejectTaskId(taskId);
    setRejectComment('');
    setRejectScreenshot(null);
    setRejectScreenshotPreview(null);
    setRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectTaskId) return;
    const taskIdToReject = rejectTaskId;
    setRejectModalOpen(false);

    // Optimistic UI Update: Remove card immediately
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.task_id !== taskIdToReject));

    if (activeReviewTask && activeReviewTask.task_id === taskIdToReject) {
      advanceToNextTask(taskIdToReject);
    }

    try {
      const formData = new FormData();
      formData.append('task_id', taskIdToReject);
      formData.append('status', 'Rejected');
      formData.append('changed_by', currentUser.id);
      formData.append('rejection_reason', rejectComment);
      if (rejectScreenshot) {
        formData.append('rejection_image', rejectScreenshot);
      }

      axios.post(`${API_BASE}api/reviewer/update_task_status.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => {
        if (res.data.status !== 'success') {
          console.error(res.data);
          alert('Failed to reject task. Reverting changes.');
          setTasks(previousTasks);
        }
      }).catch(e => {
        console.error(e);
        alert('Failed to reject task. Reverting changes.');
        setTasks(previousTasks);
      });
    } catch (e) {
      console.error(e);
      setTasks(previousTasks);
    } finally {
      setRejectTaskId(null);
      setRejectComment('');
    }
  };

  const triggerFinalDelivery = (task) => {
    setDeliveryTask(task);
    setFinalFile(null);
    setFinalFileLink('');
    setFinalImage(null);
    setFinalImagePreview(null);
    setFixNotes('');
    setDeliveryRating(5);
    setDeliveryHoverRating(0);
    setDeliveryIncludeRating(true);
    setDeliverySelectedTags(['⚡ Fast Delivery', '🎯 High Accuracy']);
    setDeliveryModalOpen(true);
  };

  const handleDeliveryTagToggle = (tag) => {
    if (deliverySelectedTags.includes(tag)) {
      setDeliverySelectedTags(deliverySelectedTags.filter(t => t !== tag));
    } else {
      setDeliverySelectedTags([...deliverySelectedTags, tag]);
    }
  };

  const submitFinalDelivery = async () => {
    if (!deliveryTask) return;
    if (!finalFile && !finalFileLink && !finalImage) {
      alert('Please provide the corrected final file (upload or link) or preview image.');
      return;
    }

    setIsSubmittingDelivery(true);
    setDeliveryProgress(5);
    const taskIdDone = deliveryTask.task_id;
    const previousTasks = [...tasks];

    try {
      const formData = new FormData();
      formData.append('task_id', taskIdDone);
      formData.append('reviewer_id', currentUser.id);
      formData.append('fix_notes', fixNotes);
      formData.append('source_type', 'reviewer_corrected');

      if (deliveryIncludeRating && deliveryRating > 0) {
        formData.append('rating', deliveryRating);
        formData.append('feedback_notes', fixNotes);
        if (deliverySelectedTags.length > 0) {
          formData.append('tags', JSON.stringify(deliverySelectedTags));
        }
      }

      if (finalFile) {
        formData.append('final_file', finalFile);
      } else if (finalFileLink) {
        formData.append('final_file_link', finalFileLink);
      }

      if (finalImage) {
        formData.append('final_image', finalImage);
      }

      const res = await axios.post(`${API_BASE}api/reviewer/submit_final_delivery.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDeliveryProgress(percent);
          }
        }
      });

      if (res.data.status === 'success') {
        confetti({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#3b82f6', '#10b981', '#fbbf24', '#a855f7']
        });

        setDeliveryModalOpen(false);
        setTasks(prev => prev.filter(t => t.task_id !== taskIdDone));

        if (activeReviewTask && activeReviewTask.task_id === taskIdDone) {
          advanceToNextTask(taskIdDone);
        }
      } else {
        alert(res.data.message || 'Failed to submit final stock delivery.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting final stock delivery: ' + (e.response?.data?.message || e.message));
      setTasks(previousTasks);
    } finally {
      setIsSubmittingDelivery(false);
      setDeliveryProgress(0);
    }
  };

  const toggleTaskSelection = (e, taskId) => {
    e.stopPropagation();
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`Are you sure you want to approve ${selectedTasks.length} tasks?`)) return;

    setActionLoading(prev => ({ ...prev, bulk: true }));
    try {
      const promises = selectedTasks.map(taskId =>
        axios.post(`${API_BASE}api/reviewer/update_task_status.php`, {
          task_id: taskId,
          status: 'Completed',
          changed_by: currentUser.id
        })
      );

      await Promise.all(promises);

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#34d399', '#10b981', '#059669', '#047857']
      });

      setTasks(prev => prev.filter(t => !selectedTasks.includes(t.task_id)));
      setSelectedTasks([]);
    } catch (e) {
      console.error(e);
      alert('Failed to bulk approve tasks.');
    } finally {
      setActionLoading(prev => ({ ...prev, bulk: false }));
    }
  };

  if (loading) return (
    <div className="mx-auto space-y-6 animate-pulse p-2">
      <div className="h-10 bg-white/5 rounded-xl w-1/4 mb-4"></div>
      <div className="h-16 bg-white/5 rounded-2xl w-full mb-6"></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-44 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiClock className="text-brand-400" /> Pending Reviews
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Tasks waiting for your review today. Click any card to inspect and take action.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="glass rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by title or priority..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all"
          />
        </div>

        {/* Staff Filter */}
        <div className="relative w-full md:w-56">
          <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-dark-900 text-white">All Staff Members</option>
            {staffList.map(name => (
              <option key={name} value={name} className="bg-dark-900 text-white">{name}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Date Filter */}
        <div className="relative w-full md:w-48 shrink-0">
          <FiCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all cursor-pointer"
          />
        </div>

        {/* Sort Filter */}
        <div className="relative w-full md:w-40 shrink-0">
          <FiFilter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="newest" className="bg-dark-900 text-white">Newest First</option>
            <option value="oldest" className="bg-dark-900 text-white">Oldest First</option>
          </select>
          <FiChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedStaff || selectedDate || sortOrder !== 'newest') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedStaff(''); setSelectedDate(''); setSortOrder('newest'); }}
            className="w-full md:w-auto shrink-0 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/5">
          <FiCheck className="mx-auto text-emerald-400 w-12 h-12 bg-emerald-500/10 p-2 rounded-full mb-3" />
          <h2 className="text-white font-bold text-lg">No pending reviews</h2>
          <p className="text-white/40 text-sm mt-1">
            {tasks.length === 0 ? "You're all caught up! No tasks waiting for review." : "No tasks match your filter criteria."}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((t, index) => {
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: 'blur(5px)' }}
                  transition={{ duration: 0.25 }}
                  key={t.task_id}
                  onClick={() => selectTaskForReview(t)}
                  className={`group relative glass rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px] overflow-hidden ${
                    selectedTasks.includes(t.task_id) 
                      ? 'border-brand-500 shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.25)] bg-brand-500/10 ring-2 ring-brand-500/20' 
                      : 'border-white/10 dark:border-white/5 hover:border-brand-500/40 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-500/15 bg-white dark:bg-dark-900'
                  }`}
                  style={{
                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 12px 24px -4px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Subtle top light sheen on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Checkbox for Bulk Action */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity data-[checked=true]:opacity-100" data-checked={selectedTasks.includes(t.task_id)}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(t.task_id)}
                      onChange={(e) => toggleTaskSelection(e, t.task_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-white/20 bg-dark-900/50 text-brand-500 focus:ring-0 cursor-pointer shadow-lg active:scale-90 transition-transform"
                    />
                  </div>

                  <div>
                    {/* Top row: Profile & Priority */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-white/10 shadow-2xs">
                          {t.staff_avatar
                            ? <img src={`${API_BASE}${t.staff_avatar}`} className="w-full h-full object-cover" alt="" />
                            : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white/50">{t.staff_name?.[0]}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-xs truncate leading-tight">{t.staff_name}</p>
                          <p className="text-white/50 text-[9px] font-semibold truncate mt-0.5">{t.department_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(Number(t.is_self_created) === 1 || t.is_self_created === true) && (
                          <span className="px-2 py-0.5 rounded-full border text-[9px] font-bold text-rose-500 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center gap-1 shadow-2xs">
                            <HiSparkles size={10} className="text-amber-400" /> Self-Task
                          </span>
                        )}
                        <span className="text-white/40 font-black text-[10px]">#{index + 1}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider shadow-2xs ${
                          t.priority === 'High' ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10'
                            : t.priority === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                              : 'text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-500/10'
                        }`}>{t.priority}</span>
                      </div>
                    </div>

                    {/* Task Title */}
                    <h3 className="text-white font-black text-sm line-clamp-2 mt-1 leading-snug group-hover:text-brand-400 transition-colors">
                      {t.title}
                    </h3>
                  </div>

                  {/* Bottom row: submitted date & CTA */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-3 text-[10px]">
                    <span className="text-white/50 font-bold flex items-center gap-1">
                      <FiCalendar size={11} className="text-white/40" /> {fmtRelativeTime(t.submitted_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerReject(t.task_id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-all border border-red-500/30 shadow-2xs active:scale-90"
                        title="Quick Reject (Shift+R)"
                      >
                        <FiX size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRatingModalTask(t); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/30 shadow-2xs active:scale-90"
                        title="Rate & Approve Task"
                      >
                        <FiCheck size={12} />
                      </button>
                      <span className="text-brand-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ml-1 border-l border-white/10 pl-2">
                        Inspect <FiEye size={12} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detailed Review Overlay Modal */}
      {activeReviewTask && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center animate-fade-in ${zenMode ? 'p-0' : 'p-4 lg:p-6'}`}>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 transition-colors duration-500 ${zenMode ? 'bg-dark-950' : 'bg-black/75 backdrop-blur-md'}`}
            onClick={() => { setActiveReviewTask(null); setZenMode(false); }}
          />

          {/* Modal Container */}
          <div className={`relative z-10 glass border border-white/5 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${zenMode ? 'w-screen h-screen rounded-none border-0' : 'rounded-3xl w-full max-w-6xl max-h-[90vh]'
            }`}>
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
                    {activeReviewTask.department_name} • Submitted {fmtRelativeTime(activeReviewTask.submitted_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(Number(activeReviewTask.is_self_created) === 1 || activeReviewTask.is_self_created === true) && (
                  <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center gap-1.5 shadow-sm">
                    <HiSparkles size={13} className="text-amber-400" /> Self-Initiative
                  </span>
                )}

                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${activeReviewTask.priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/5'
                    : activeReviewTask.priority === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                      : 'text-slate-400 border-slate-500/30 bg-slate-500/5'
                  }`}>{activeReviewTask.priority} Priority</span>

                <button
                  onClick={() => setZenMode(!zenMode)}
                  className="text-white/40 hover:text-brand-400 p-1.5 rounded-lg hover:bg-brand-500/10 transition-all border border-transparent hover:border-brand-500/20"
                  title="Toggle Zen Mode"
                >
                  {zenMode ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                </button>

                <button
                  onClick={() => { setActiveReviewTask(null); setZenMode(false); }}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              {/* Task Title & Tabs Header */}
              <div className="space-y-4">
                <h1 className="text-white font-bold text-xl leading-snug">{activeReviewTask.title}</h1>

                {/* 2-Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <button
                    type="button"
                    onClick={() => setModalTab('submission')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${modalTab === 'submission'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FiPackage size={14} className={modalTab === 'submission' ? 'text-emerald-600 dark:text-emerald-400' : 'text-white/40'} />
                    <span>Submitted Deliverables</span>
                    {activeReviewTask.submissions && activeReviewTask.submissions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-900 dark:text-emerald-200">
                        {activeReviewTask.submissions.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('instructions')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${modalTab === 'instructions'
                        ? 'bg-brand-500/15 text-brand-800 dark:text-brand-300 border border-brand-500/40 shadow-xs'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FiFileText size={14} className={modalTab === 'instructions' ? 'text-brand-600 dark:text-brand-400' : 'text-white/40'} />
                    <span>Task Brief & Instructions</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (2/3 width): Active Tab Content */}
                <div className="lg:col-span-2 space-y-6">
                  {modalTab === 'submission' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Task Deliverables (Cloudflare R2 Direct Submissions + Links) */}
                      <TaskDeliverablesViewer
                        submissions={activeReviewTask.submissions}
                        submissionLink={activeReviewTask.submission_link}
                        totalTimeSpent={activeReviewTask.total_time_spent}
                        submittedAt={activeReviewTask.submitted_at}
                        onImageClick={(url) => setSelectedImage(url)}
                      />

                      {/* Legacy Staff Uploaded Work Image */}
                      <VisualWorkImageRenderer imgPath={activeReviewTask.visual_image} />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {activeReviewTask.blueprint_variants && activeReviewTask.blueprint_variants.length > 0 ? (
                        <AgenticBlueprintViewer variants={activeReviewTask.blueprint_variants} />
                      ) : (
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                          <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiFileText className="text-brand-400" size={14} /> Full Description & Specifications
                          </h4>
                          <DescriptionRenderer htmlContent={activeReviewTask.description} />
                        </div>
                      )}
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
            <div className="p-5 border-t border-white/5 bg-dark-900/90 backdrop-blur-md flex items-center justify-end gap-3 rounded-b-3xl">
              {actionLoading[activeReviewTask.task_id] ? (
                <div className="flex items-center justify-center py-2 px-6">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveReviewTask(null)}
                    className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl border border-white/10 bg-dark-800 hover:bg-dark-700 text-white/80 text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => triggerReject(activeReviewTask.task_id)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <FiX size={15} /> Reject
                  </button>
                  <button
                    onClick={() => triggerFinalDelivery(activeReviewTask)}
                    className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
                  >
                    <HiSparkles size={16} className="text-amber-300" /> Upload Stock Final Version
                  </button>
                  <button
                    onClick={() => setRatingModalTask(activeReviewTask)}
                    className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <FiCheck size={15} /> Rate & Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rejection Modal popup */}
      {rejectModalOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => { setRejectModalOpen(false); setRejectTaskId(null); }}
          />

          {/* Modal Container */}
          <div className="relative z-10 rounded-3xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-4 shadow-2xl animate-fade-in bg-dark-900 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <h3 className="text-red-500 font-bold text-base flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                  <FiX size={18} />
                </div>
                Reject Submission
              </h3>
              <button
                type="button"
                onClick={() => { setRejectModalOpen(false); setRejectTaskId(null); }}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider block mb-2">
                  Smart Macros / Quick Reasons
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {smartMacros.map(macro => (
                    <button
                      key={macro.label}
                      type="button"
                      onClick={() => setRejectComment(prev => prev ? prev + '\n\n' + macro.text : macro.text)}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{macro.icon}</span> {macro.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Rejection Reason / Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectComment}
                  onChange={e => setRejectComment(e.target.value)}
                  placeholder="Describe the issue / reason for rejection in detail..."
                  className="w-full h-28 bg-dark-950/70 border border-white/10 text-white placeholder-white/30 rounded-xl p-3 text-xs outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-white/70 text-[11px] font-bold uppercase tracking-wider block mb-1.5">
                  Attachment / Screenshot (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-3.5 text-center transition-all relative overflow-hidden ${
                    isDragging 
                      ? 'border-red-500 bg-red-500/10 scale-[1.01]' 
                      : 'border-white/10 hover:border-red-400/50 bg-dark-950/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setRejectScreenshot(file);
                      setRejectScreenshotPreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  {rejectScreenshotPreview ? (
                    <div className="relative inline-block w-full h-28 group">
                      <img src={rejectScreenshotPreview} alt="Screenshot preview" className="w-full h-full object-contain rounded-xl" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRejectScreenshot(null); setRejectScreenshotPreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer h-24 w-full">
                      <FiImage className="text-white/30 mb-1" size={22} />
                      <span className="text-white/80 text-xs font-semibold">Click or Drag & Drop screenshot</span>
                      <span className="text-white/40 text-[10px] mt-0.5">(Or press Ctrl+V to paste)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setRejectScreenshot(file);
                            setRejectScreenshotPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setRejectModalOpen(false); setRejectTaskId(null); }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-dark-800 hover:bg-dark-700 text-white/80 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRejection}
                disabled={!rejectComment.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
              >
                <FiSend size={14} /> Submit Rejection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reviewer Final Stock Delivery Modal */}
      {deliveryModalOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
            onClick={() => { if (!isSubmittingDelivery) { setDeliveryModalOpen(false); setDeliveryTask(null); } }}
          />

          <div className="relative z-10 glass rounded-3xl border border-slate-200 dark:border-blue-500/30 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl animate-fade-in bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <HiSparkles size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-black text-sm tracking-wide">
                    Upload Corrected Stock Version
                  </h3>
                  <p className="text-slate-500 dark:text-white/40 text-[11px]">
                    Preserves staff's original submission while saving your final stock-ready file
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (!isSubmittingDelivery) { setDeliveryModalOpen(false); setDeliveryTask(null); } }}
                className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Task Info Chip */}
            {deliveryTask && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold">Task Title</p>
                  <p className="text-slate-800 dark:text-white font-bold truncate">{deliveryTask.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold">Staff</p>
                  <p className="text-indigo-600 dark:text-brand-400 font-bold">{deliveryTask.staff_name}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* 1. Final Source File (PSD / ZIP / Link) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiPackage className="text-blue-500 dark:text-blue-400" /> Corrected Final Source File (PSD / ZIP / AI)
                </label>

                <div className="flex flex-col gap-2">
                  <div
                    className={`border-2 border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition-all flex items-center justify-between gap-2 relative ${
                      finalFile 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-slate-900 dark:text-white' 
                        : 'border-slate-200 dark:border-white/10 hover:border-blue-500/50 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setFinalFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <label className="flex items-center justify-center gap-2 cursor-pointer flex-1 min-w-0">
                      <FiDownload size={16} className={finalFile ? "text-blue-500 dark:text-blue-400 shrink-0" : "text-slate-400 dark:text-white/30 shrink-0"} />
                      <span className="text-xs font-semibold truncate">
                        {finalFile ? finalFile.name : 'Click or Drag & Drop Final PSD / ZIP File'}
                      </span>
                      <input
                        type="file"
                        accept=".psd,.ai,.eps,.zip,.rar,.7z,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setFinalFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {finalFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFinalFile(null);
                        }}
                        className="p-1 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/40 transition-colors shrink-0"
                        title="Remove File"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <FiLink size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                    <input
                      type="url"
                      placeholder="Or enter Drive / Cloud storage link..."
                      value={finalFileLink}
                      onChange={(e) => setFinalFileLink(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Final Preview Image Dropzone / Paste */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiImage className="text-blue-500 dark:text-blue-400" /> Final Corrected Preview Image (JPG/PNG)
                </label>

                <div
                  className={`border-2 border-dashed rounded-2xl p-3 text-center transition-all relative overflow-hidden ${
                    isDraggingFinal 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                      : 'border-slate-200 dark:border-white/10 hover:border-blue-500/50 bg-slate-50 dark:bg-white/5'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFinal(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingFinal(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFinal(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setFinalImage(file);
                      setFinalImagePreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  {finalImagePreview ? (
                    <div className="relative inline-block w-full h-28 group">
                      <img src={finalImagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFinalImage(null); setFinalImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer h-24 w-full">
                      <FiImage className="text-slate-400 dark:text-white/30 mb-1" size={20} />
                      <span className="text-slate-600 dark:text-white/70 text-xs font-medium">Click or Drag & Drop preview image</span>
                      <span className="text-slate-400 dark:text-white/35 text-[10px] mt-0.5">(Or press Ctrl+V to paste)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFinalImage(file);
                            setFinalImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 3. Optional 5-Star Rating & Recognition Toggle Section */}
              <div className="bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deliveryIncludeRating}
                      onChange={(e) => setDeliveryIncludeRating(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <FiStar className="text-amber-400 fill-amber-400" size={14} /> 
                      Give Staff Rating & Recognition
                    </span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    deliveryIncludeRating 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                  }`}>
                    {deliveryIncludeRating ? `${deliveryRating} Stars` : 'No Stars'}
                  </span>
                </div>

                {deliveryIncludeRating && (
                  <div className="space-y-3 pt-1 border-t border-slate-200/70 dark:border-white/5 animate-fade-in">
                    {/* Interactive Star Buttons */}
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isAct = star <= (deliveryHoverRating || deliveryRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setDeliveryRating(star)}
                              onMouseEnter={() => setDeliveryHoverRating(star)}
                              onMouseLeave={() => setDeliveryHoverRating(0)}
                              className="p-1 transition-transform hover:scale-125 focus:outline-none"
                            >
                              <FiStar
                                size={24}
                                className={`${
                                  isAct
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                                    : 'text-slate-200 dark:text-white/20'
                                } transition-colors duration-150`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[11px] font-bold mt-1 text-slate-600 dark:text-white/60">
                        {deliveryRating} / 5 ⭐ {DELIVERY_STAR_LABELS[deliveryHoverRating || deliveryRating]?.label}
                      </div>
                    </div>

                    {/* Quick Tags */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <FiTag size={11} /> Quick Quality Tags
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DELIVERY_SUGGESTED_TAGS.map((tag) => {
                          const isSel = deliverySelectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleDeliveryTagToggle(tag)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                                isSel
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-brand-500/20 dark:border-brand-500/40 dark:text-brand-300 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/[0.03] dark:border-white/10 dark:text-white/50 dark:hover:text-white'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Fix Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FiFileText className="text-blue-500 dark:text-blue-400" /> Stock Correction Notes / Feedback (Optional)
                </label>
                <textarea
                  rows={2}
                  value={fixNotes}
                  onChange={(e) => setFixNotes(e.target.value)}
                  placeholder="e.g. Corrected bleed margin and adjusted font weight for stock guidelines..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 rounded-xl p-3 text-xs outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
            </div>

            {/* Upload Progress Indicator */}
            {isSubmittingDelivery && (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
                    Uploading Final PSD / JPG to Cloudflare R2...
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{deliveryProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${deliveryProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingDelivery}
                onClick={() => { setDeliveryModalOpen(false); setDeliveryTask(null); }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] dark:hover:bg-white/[0.06] text-slate-700 dark:text-white/70 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelivery || (!finalFile && !finalFileLink && !finalImage)}
                onClick={submitFinalDelivery}
                className="flex-[1.5] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                {isSubmittingDelivery ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck size={14} />
                    <span>
                      {deliveryIncludeRating && deliveryRating > 0
                        ? `Submit Final & Rate (${deliveryRating} ⭐)`
                        : 'Approve as Final Stock Version'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Action Bar */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/30 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-scale-in">
          <span className="text-white text-sm font-semibold">
            <span className="text-emerald-400">{selectedTasks.length}</span> tasks selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTasks([])}
              className="text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading.bulk}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {actionLoading.bulk ? <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" /> : <FiCheck />}
              Approve All
            </button>
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
      {/* 5-Star Approval & Rating Modal */}
      <ApprovalRatingModal
        isOpen={!!ratingModalTask}
        task={ratingModalTask}
        onClose={() => setRatingModalTask(null)}
        onConfirm={async (ratingData) => {
          if (ratingModalTask) {
            await handleStatusUpdate(ratingModalTask.task_id, 'Completed', ratingData);
          }
        }}
      />
    </div>
  );
};

export default PendingReviews;
