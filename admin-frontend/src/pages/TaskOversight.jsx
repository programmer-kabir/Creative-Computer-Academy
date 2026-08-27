import React, { useState, useEffect, useRef, useMemo } from 'react';
import Pusher from 'pusher-js';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import JoditEditor from 'jodit-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { FiCheckCircle, FiXCircle, FiClock, FiLink, FiAlertCircle, FiPlus, FiX, FiEdit2, FiCpu, FiSearch, FiUser, FiCalendar, FiTarget, FiBarChart2, FiCopy, FiImage, FiTrash, FiDownload, FiMessageSquare, FiSend, FiTrash2, FiFlag, FiList, FiType, FiTag, FiUsers, FiCode, FiPaperclip } from 'react-icons/fi';
import { ModalShell } from '../components/TaskOversight/ModalShell';
import { ImageLightbox } from '../components/TaskOversight/ImageLightbox';
import { DateFilterBar } from '../components/TaskOversight/DateFilterBar';
import { StaffFilterDropdown } from '../components/TaskOversight/StaffFilterDropdown';
import { DeptFilterDropdown } from '../components/TaskOversight/DeptFilterDropdown';
import { TaskFormFields } from '../components/TaskOversight/TaskFormFields';
import { TaskCard } from '../components/TaskOversight/TaskCard';
import { useTaskActions } from '../hooks/useTaskActions';
import { DescriptionRenderer } from '../components/TaskOversight/TaskDescriptionRenderer';
import { StatsGrid } from '../components/TaskOversight/StatsGrid';
import { AgenticTaskModal } from '../components/TaskOversight/AgenticTaskModal';
import AgenticBlueprintViewer from '../components/AgenticBlueprintViewer';
import TaskDeliverablesViewer from '../components/TaskDeliverablesViewer';
import { HiSparkles } from 'react-icons/hi';

// Helper to strip HTML and decode entities for card previews
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  text = text.replace(/&nbsp;/g, ' ');
  return text;
};




// Color/icon pool — cycles for any department name

const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  assigned_to: '',
  assign_date: new Date().toISOString().split('T')[0],
  deadline: '',
  deadline_time: '',
  ref_links: [''],
  ref_image: [],
  visual_image: [],
  checklists: [],
  submission_link: '',
};

// ─── Dashboard Components ───────────────────────────────────────────────────



const TaskOversight = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [workloads, setWorkloads] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState(null);
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'staff'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all'); // 'all' | 'unassigned' | name
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState(null);
  const [activeHistoryLogs, setActiveHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [detailsTab, setDetailsTab] = useState('comments'); // 'comments' | 'history'
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Comments for details modal
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);

  // Reject Modal
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Lightbox and Zoom state
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxScale, setLightboxScale] = useState(2); // Default to 2x for hover zoom
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState(EMPTY_TASK_FORM);
  const [taskCreationMode, setTaskCreationMode] = useState('agentic');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const createEditorRef = useRef(null);
  const editEditorRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Sync default Task Creation Mode from user settings
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUserSettings = async () => {
      try {
        const res = await axios.post(`${API_BASE}api/settings/get_user_settings.php`, {
          user_id: currentUser.id
        });
        if (res.data.status === 'success' && res.data.settings?.task_creation_mode) {
          setTaskCreationMode(res.data.settings.task_creation_mode);
        }
      } catch (e) {
        console.error('Failed to load user task settings:', e);
      }
    };
    fetchUserSettings();
  }, [currentUser, API_BASE]);

  const { handleDeleteComment, handleSaveEdit, handleAddComment, fetchTaskHistory, fetchComments, joditConfig, fetchTasksAndStaff, handleCreateTask, openEditModal, handleEditTask, handleDeleteTask, handleDuplicateTask, handleStatusChange, filteredTasks, stats, renderColumns, getColStyle, handleRejectClick, submitReject } = useTaskActions({
    apiBase: API_BASE,
    currentUser,
    setTasks,
    setComments,
    setAddingComment,
    setNewComment,
    setCommentImage,
    setCommentImagePreview,
    commentsEndRef,
    setCommentsLoading,
    setHistoryTask,
    setIsHistoryOpen,
    setLoadingHistory,
    setActiveHistoryLogs,
    setEditingCommentId,
    editCommentText,
    setEditCommentText,
    setStaff,
    setDepartments,
    setWorkloads,
    setLoading,
    newTask,
    setNewTask,
    setActionLoading,
    setIsCreateOpen,
    departments,
    EMPTY_TASK_FORM,
    staff,
    editTask,
    setEditTask,
    setIsEditOpen,
    taskToDelete,
    setTaskToDelete,
    setIsDetailsOpen,
    setDetailsTask,
    tasks,
    dateFilter,
    customDateRange,
    searchTerm,
    selectedDeptFilter,
    selectedStaffFilter,
    groupBy,
    rejectTask,
    setRejectTask,
    rejectReason,
    setRejectReason
  });

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxScale(2);
    setIsHovered(false);
    setZoomPos({ x: 50, y: 50 });
  };


  // Comments logic for details modal
  useEffect(() => {
    if (detailsTask?.id) {
      fetchComments(detailsTask.id);

      const pusher = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2'
      });
      const channel = pusher.subscribe(`task-comments-${detailsTask.id}`);

      channel.bind('new-comment', function (newComment) {
        setComments(prev => {
          if (prev.find(c => String(c.id) === String(newComment.id))) return prev;
          return [...prev, newComment];
        });
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        pusher.disconnect();
      };
    } else {
      setComments([]);
      setNewComment('');
    }
  }, [detailsTask?.id]);



  useEffect(() => { fetchTasksAndStaff(); }, []);



  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Task Oversight</h1>
          <p className="text-slate-500 mt-1 font-medium">Review pending submissions and monitor organizational task progress.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors"
        >
          <FiPlus size={20} />
          <span>Assign Task</span>
        </button>
      </div>

      {/* Dashboard Stats & Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Side: Filter Options */}
          <div className="flex flex-wrap items-center gap-3">
            <DateFilterBar
              filter={dateFilter}
              setFilter={setDateFilter}
              customRange={customDateRange}
              setCustomRange={setCustomDateRange}
            />

            {/* Task Search Bar */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 h-11 flex items-center gap-2 w-72 flex-shrink-0">
              <FiSearch size={16} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tasks, staff, category..."
                className="bg-transparent text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Dept Filter Dropdown */}
            <DeptFilterDropdown
              value={selectedDeptFilter}
              onChange={setSelectedDeptFilter}
              departments={departments}
            />

            {/* Staff Filter Dropdown */}
            <StaffFilterDropdown
              value={selectedStaffFilter}
              onChange={setSelectedStaffFilter}
              staff={staff}
              apiBase={API_BASE}
            />
          </div>

          {/* Right Side: Grouping Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl h-11 flex-shrink-0">
            <button
              onClick={() => setGroupBy('status')}
              className={`px-4 h-9 rounded-xl text-sm font-bold transition-all ${groupBy === 'status' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Group by Status
            </button>
            <button
              onClick={() => setGroupBy('staff')}
              className={`px-4 h-9 rounded-xl text-sm font-bold transition-all ${groupBy === 'staff' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Group by Staff
            </button>
          </div>
        </div>
        <StatsGrid stats={stats} />
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (

        <div className="flex flex-col h-[calc(100vh-340px)] min-h-[480px]">
          {/* Tabs Header */}
          <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-4 border-b border-slate-200">
            {Object.keys(renderColumns).map((colKey) => {
              const isActive = activeTab === colKey || (!activeTab && colKey === Object.keys(renderColumns)[0]);
              const style = getColStyle(colKey);
              return (
                <button
                  key={colKey}
                  onClick={() => setActiveTab(colKey)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all font-bold text-sm uppercase tracking-wider whitespace-nowrap ${isActive
                    ? `bg-white dark:bg-slate-800 text-${style.text.split('-')[1] || 'blue'}-600 border-t-2 border-l border-r border-slate-200 dark:border-slate-700/50 ${style.border} shadow-[0_-2px_10px_rgba(0,0,0,0.02)]`
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 border-transparent border-t-2'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                  {colKey}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {renderColumns[colKey].length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          {(() => {
            const currentTab = activeTab && renderColumns[activeTab] ? activeTab : Object.keys(renderColumns)[0];
            if (!currentTab) return null;

            const colTasks = renderColumns[currentTab];
            const style = getColStyle(currentTab);

            return (
              <div className={`flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl rounded-tr-2xl p-6 border ${style.border} dark:border-slate-800`}>
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                    <FiList size={48} className="mb-4 opacity-20" />
                    <p className="font-semibold">No tasks in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={String(task.id)}
                        task={task}
                        isReview={task.status === 'In Review'}
                        apiBase={API_BASE}
                        onEdit={openEditModal}
                        onDuplicate={handleDuplicateTask}
                        onViewHistory={fetchTaskHistory}
                        onOpenDetails={(task) => { setDetailsTask(task); setIsDetailsOpen(true); }}
                        onStatusChange={handleStatusChange}
                        onReject={handleRejectClick}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

      )}

      {/* ── Reject Modal ── */}
      {rejectTask && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <FiXCircle size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Reject Task</h3>
                <p className="text-xs text-slate-500 font-semibold">Provide feedback to the assignee.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rejection Reason / Feedback *</label>
                <textarea
                  autoFocus
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain what needs to be fixed..."
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                type="button"
                onClick={() => setRejectTask(null)}
                className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Create Task Modal (Conditional: Agentic vs Manual) ── */}
      {isCreateOpen && taskCreationMode === 'agentic' ? (
        <AgenticTaskModal
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); setNewTask(EMPTY_TASK_FORM); }}
          formData={newTask}
          setFormData={setNewTask}
          staff={staff}
          workloads={workloads}
          departments={departments}
          apiBase={API_BASE}
          onSubmit={handleCreateTask}
          actionLoading={actionLoading}
          onSwitchToManual={() => setTaskCreationMode('manual')}
        />
      ) : isCreateOpen && (
        <ModalShell
          title="Assign New Task"
          onClose={() => { setIsCreateOpen(false); setNewTask(EMPTY_TASK_FORM); }}
          onSubmit={handleCreateTask}
          submitLabel="Assign Task"
          actionLoading={actionLoading}
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setTaskCreationMode('agentic')}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
            >
              <FiCpu size={13} /> Switch to Agentic Mode
            </button>
          </div>
          <TaskFormFields
            formData={newTask}
            setFormData={setNewTask}
            editorRef={createEditorRef}
            staff={staff}
            workloads={workloads}
            joditConfig={joditConfig}
            apiBase={API_BASE}
            departments={departments}
          />
        </ModalShell>
      )}

      {/* ── Edit Task Modal ── */}
      {isEditOpen && editTask && (
        <ModalShell
          title="Edit Task"
          onClose={() => { setIsEditOpen(false); setEditTask(null); }}
          onSubmit={handleEditTask}
          submitLabel="Save Changes"
          actionLoading={actionLoading}
          onDelete={() => setTaskToDelete(editTask)}
        >
          <TaskFormFields
            formData={editTask}
            setFormData={setEditTask}
            editorRef={editEditorRef}
            staff={staff}
            workloads={workloads}
            joditConfig={joditConfig}
            apiBase={API_BASE}
            departments={departments}
            isEdit
          />
        </ModalShell>
      )}

      {/* ── Task History Drawer (Slide-over Right Panel) ── */}
      {isHistoryOpen && historyTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => { setIsHistoryOpen(false); setHistoryTask(null); setActiveHistoryLogs([]); }} />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-lg text-slate-800">Task Activity Logs</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate max-w-[280px]">
                  {historyTask.title}
                </p>
              </div>
              <button
                onClick={() => { setIsHistoryOpen(false); setHistoryTask(null); setActiveHistoryLogs([]); }}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {loadingHistory ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3" />
                  <p className="text-sm font-semibold text-slate-400">Loading logs...</p>
                </div>
              ) : activeHistoryLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <FiClock size={20} />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No status logs recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6">
                  {activeHistoryLogs.map((log) => {
                    const date = new Date(log.created_at.includes('T') || log.created_at.includes('Z') ? log.created_at : log.created_at.replace(' ', 'T') + 'Z');
                    const formattedDate = date.toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                    return (
                      <div key={log.id} className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-slate-100">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        </span>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-800 leading-snug">
                            Moved to <span className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${log.status_to === 'In Review' ? 'bg-orange-100 text-orange-700' :
                              log.status_to === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                log.status_to === 'In Progress' ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>{log.status_to}</span>
                            {log.status_from && (
                              <span className="text-slate-500 font-medium"> from {log.status_from}</span>
                            )}
                          </p>

                          <div className="flex items-center gap-1.5">
                            {log.changed_by_avatar ? (
                              <img src={`${API_BASE}${log.changed_by_avatar}`} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-[9px] uppercase">
                                {log.changed_by_name ? log.changed_by_name.charAt(0) : '?'}
                              </div>
                            )}
                            <span className="text-xs font-bold text-slate-600 truncate">{log.changed_by_name || 'System'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold pt-0.5">
                            <FiCalendar size={11} />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <FiClock size={11} />
                            <span>{formattedTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                type="button"
                onClick={() => { setIsHistoryOpen(false); setHistoryTask(null); setActiveHistoryLogs([]); }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-center text-sm"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Task Details Modal ── */}
      {isDetailsOpen && detailsTask && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => { setIsDetailsOpen(false); setDetailsTask(null); }} />

          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-[1540px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiTarget size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">Task Details</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">ID: #{detailsTask.id}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsDetailsOpen(false); setDetailsTask(null); }}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Column: Details */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                    {detailsTask.category}
                  </span>
                  {(detailsTask.creation_mode === 'agentic' || Boolean(detailsTask.blueprint_data)) && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm">
                      <HiSparkles size={13} className="text-amber-500" /> Agentic AI Task
                    </span>
                  )}
                  {detailsTask.priority && detailsTask.priority !== 'Medium' && (
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${detailsTask.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                      <FiFlag size={14} /> {detailsTask.priority} Priority
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${detailsTask.status === 'In Review' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    detailsTask.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      detailsTask.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                    {detailsTask.status}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">{detailsTask.title}</h2>

                {/* Specifications & Description (Adaptive: Agentic Blueprint vs Classic Description) */}
                <div className="space-y-2">
                  {detailsTask.blueprint_data ? (
                    <AgenticBlueprintViewer blueprint={detailsTask.blueprint_data} />
                  ) : (
                    <>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description & Instructions</h4>
                      <DescriptionRenderer htmlContent={detailsTask.description} />
                    </>
                  )}
                </div>

                {/* Assigned Info & Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Assignee Card */}
                  <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {detailsTask.assigned_to_avatar ? (
                        <img src={`${API_BASE}${detailsTask.assigned_to_avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase">
                          {detailsTask.assigned_to_name ? detailsTask.assigned_to_name.charAt(0) : '?'}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{detailsTask.assigned_to_name || 'Unassigned'}</p>
                    </div>
                  </div>

                  {/* Date Card */}
                  <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <FiCalendar size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Assigned</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {new Date(detailsTask.assign_date || detailsTask.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Time Spent Card */}
                  <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <FiClock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Time Spent</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {(() => {
                          let totalSecs = parseInt(detailsTask.total_time_spent || 0, 10);
                          if (detailsTask.timer_status === 'Running' && detailsTask.session_start_time) {
                            const start = new Date(detailsTask.session_start_time.replace(' ', 'T') + 'Z').getTime();
                            const now = Date.now();
                            totalSecs += Math.floor((now - start) / 1000);
                          }
                          const hrs = Math.floor(totalSecs / 3600);
                          const mins = Math.floor((totalSecs % 3600) / 60);
                          return `${hrs}h ${mins}m`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checklists */}
                {detailsTask.checklists && detailsTask.checklists.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sub-tasks / Checklist</h4>
                    <div className="space-y-2">
                      {detailsTask.checklists.map((cl, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${cl.is_completed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${cl.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                            {cl.is_completed && <FiCheckCircle size={14} />}
                          </div>
                          <span className={`text-sm font-semibold ${cl.is_completed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'}`}>
                            {cl.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference Links */}
                {detailsTask.ref_links && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Links</h4>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        let links = [];
                        try {
                          const parsed = JSON.parse(detailsTask.ref_links);
                          links = Array.isArray(parsed) ? parsed : [detailsTask.ref_links];
                        } catch {
                          links = [detailsTask.ref_links];
                        }
                        links = links.filter(l => l && l.trim());

                        if (links.length === 0) return <p className="text-sm text-slate-400 italic">No reference links provided.</p>;

                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-sm transition-all truncate"
                          >
                            <FiLink size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Target Visual Images */}
                {detailsTask.visual_image && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider"><FiTarget size={12} /> Target Visual Image</h4>
                    {(() => {
                      let imgs = [];
                      try {
                        const parsed = JSON.parse(detailsTask.visual_image);
                        imgs = Array.isArray(parsed) ? parsed : [detailsTask.visual_image];
                      } catch {
                        imgs = detailsTask.visual_image ? [detailsTask.visual_image] : [];
                      }
                      imgs = imgs.filter(img => img && typeof img === 'string' && img.trim());

                      if (imgs.length === 0) return null;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {imgs.map((imgUrl, idx) => {
                            const fullUrl = `${API_BASE}${imgUrl}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightboxImage(fullUrl); }}
                                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-indigo-100 bg-indigo-50/30 hover:shadow-md hover:border-indigo-300 transition-all group outline-none"
                              >
                                <img src={fullUrl} alt={`Target Visual ${idx + 1}`} className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300" />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Reference Images */}
                {detailsTask.ref_image && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reference Images</h4>
                    {(() => {
                      let imgs = [];
                      try {
                        const parsed = JSON.parse(detailsTask.ref_image);
                        imgs = Array.isArray(parsed) ? parsed : [detailsTask.ref_image];
                      } catch {
                        imgs = detailsTask.ref_image ? [detailsTask.ref_image] : [];
                      }
                      imgs = imgs.filter(img => img && img.trim());

                      if (imgs.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 italic">No reference images uploaded.</p>;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {imgs.map((imgUrl, idx) => {
                            const fullUrl = `${API_BASE}${imgUrl}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightboxImage(fullUrl); }}
                                className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all group outline-none"
                              >
                                <img src={fullUrl} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Reviewer Final Stock-Ready Production Delivery */}
                {detailsTask.final_delivery && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 via-indigo-900/5 to-slate-900/10 dark:bg-blue-950/20 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-500 flex items-center justify-center">
                          <HiSparkles size={18} className="text-amber-500" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                            Reviewer Corrected Stock Version
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9px] font-bold">
                              Stock-Ready
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Corrected by {detailsTask.final_delivery.reviewer_name || 'Reviewer'} • Ready for Stock Upload
                          </p>
                        </div>
                      </div>

                      {detailsTask.final_delivery.final_file_url && (
                        <a
                          href={detailsTask.final_delivery.final_file_url.startsWith('http') ? detailsTask.final_delivery.final_file_url : `${apiBase}${detailsTask.final_delivery.final_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                          <FiDownload size={13} /> Download Final Stock PSD
                        </a>
                      )}
                    </div>

                    {detailsTask.final_delivery.fix_notes && (
                      <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Correction Remarks:</span>
                        {detailsTask.final_delivery.fix_notes}
                      </div>
                    )}

                    {detailsTask.final_delivery.final_image_url && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Final Stock Preview Image</p>
                        <div className="max-w-xs rounded-xl overflow-hidden border border-blue-500/20 bg-slate-100 dark:bg-slate-950">
                          <img
                            src={detailsTask.final_delivery.final_image_url.startsWith('http') ? detailsTask.final_delivery.final_image_url : `${apiBase}${detailsTask.final_delivery.final_image_url}`}
                            alt="Final Stock Preview"
                            onClick={() => setLightboxImage(detailsTask.final_delivery.final_image_url.startsWith('http') ? detailsTask.final_delivery.final_image_url : `${apiBase}${detailsTask.final_delivery.final_image_url}`)}
                            className="w-full max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submitted Work Deliverables (Cloudflare R2 + Links) */}
                {((detailsTask.submissions && detailsTask.submissions.length > 0) || detailsTask.submission_link) && (
                  <div className="space-y-3">
                    {detailsTask.final_delivery && (
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider pl-1">
                        Staff Original Submission (Preserved History)
                      </p>
                    )}
                    <TaskDeliverablesViewer
                      submissions={detailsTask.submissions}
                      submissionLink={detailsTask.submission_link}
                      onImageClick={(url) => setLightboxImage(url)}
                    />
                  </div>
                )}

              </div>

              {/* ──────── RIGHT COLUMN: COMMENTS & HISTORY ──────── */}
              <div className="w-full lg:w-[400px] xl:w-[480px] flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 overflow-hidden flex-shrink-0">
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-4 px-6 pt-6 flex-shrink-0">
                  <button
                    onClick={() => setDetailsTab('comments')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${detailsTab === 'comments' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FiMessageSquare size={14} /> Comments
                      {comments.length > 0 && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>}
                    </div>
                    {detailsTab === 'comments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                  </button>
                  <button
                    onClick={() => setDetailsTab('history')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${detailsTab === 'history' ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FiClock size={14} /> Activity Timeline
                    </div>
                    {detailsTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                  </button>
                </div>

                {detailsTab === 'comments' && (
                  <>

                    {/* Comment list */}
                    <div className="space-y-3 flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
                      {commentsLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-400 font-semibold">No comments yet. Add a note below!</p>
                        </div>
                      ) : (
                        comments.map(c => {
                          const isMe = c.user_id === currentUser.id;
                          return (
                            <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                {c.profile_picture ? (
                                  <img src={`${API_BASE}${c.profile_picture}`} alt={c.user_name} style={{ width: '36px', height: '36px', objectFit: 'cover', display: 'block' }} />
                                ) : (
                                  <div style={{ width: '36px', height: '36px' }} className="bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-black uppercase">
                                    {c.user_name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  {!isMe && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{c.user_name}</span>}
                                  {c.user_role === 'admin' && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black px-2 py-0.5 rounded">Admin</span>}
                                  {c.user_role === 'staff' && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black px-2 py-0.5 rounded">Staff</span>}
                                </div>

                                {editingCommentId === c.id ? (
                                  <div className="flex flex-col gap-2 w-full min-w-[200px]">
                                    <textarea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      autoFocus
                                      className="w-full px-3 py-2 text-sm border border-blue-400 rounded-xl outline-none resize-none bg-white text-slate-800"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(c.id)}
                                        className="flex-1 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                                      >Save</button>
                                      <button
                                        onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                        className="flex-1 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                                      >Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                                    }`}>
                                    {c.image && (
                                      <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightboxImage(`${API_BASE}${c.image}`)}>
                                        <img src={`${API_BASE}${c.image}`} alt="Attachment" className="max-h-48 object-cover rounded-xl" />
                                      </div>
                                    )}
                                    {c.comment}
                                    {isMe && (
                                      <div className="absolute -top-3 left-1 hidden group-hover:flex gap-1">
                                        <button
                                          onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }}
                                          className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={9} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(c.id)}
                                          className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={9} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <span className={`text-xs text-slate-400 mt-1 font-medium ${isMe ? 'text-right' : ''}`}>
                                  {new Date(c.created_at.includes('T') || c.created_at.includes('Z') ? c.created_at : c.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Add comment */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex-shrink-0">
                      {commentImagePreview && (
                        <div className="mb-2 relative inline-block">
                          <img src={commentImagePreview} alt="Preview" className="h-20 rounded-xl object-cover border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => { setCommentImage(null); setCommentImagePreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      )}
                      <form onSubmit={(e) => handleAddComment(e, detailsTask, newComment, commentImage)} className="flex items-center gap-3">
                        <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                          {currentUser?.profile_picture ? (
                            <img src={`${API_BASE}${currentUser.profile_picture}`} alt="You" style={{ width: '36px', height: '36px', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px' }} className="bg-blue-600 text-white flex items-center justify-center text-sm font-black uppercase">
                              {currentUser?.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <label className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors" title="Attach Image">
                          <FiImage size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setCommentImage(file);
                                setCommentImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>

                        <input
                          type="text"
                          placeholder="Write a comment or note..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={(!newComment.trim() && !commentImage) || addingComment}
                          className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-40"
                        >
                          {addingComment ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <FiSend size={15} />}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {detailsTab === 'history' && (
                  <div className="space-y-4 flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {(!detailsTask.history || detailsTask.history.length === 0) ? (
                      <p className="text-sm text-slate-400 italic">No history available.</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4 pt-2">
                        {detailsTask.history.map((h, i) => (
                          <div key={i} className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.action_text}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              By {h.performed_by_name} • {new Date(h.created_at.includes('T') || h.created_at.includes('Z') ? h.created_at : h.created_at.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setTaskToDelete(detailsTask)}
                className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 font-bold rounded-xl transition-colors text-sm flex items-center gap-1.5"
              >
                <FiTrash2 size={14} /> Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailsOpen(false);
                  openEditModal(detailsTask);
                }}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm flex items-center gap-1.5"
              >
                <FiEdit2 size={14} /> Edit Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailsOpen(false);
                  setDetailsTask(null);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete Confirmation Modal ── */}
      {taskToDelete && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Delete Task?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={actionLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Image Lightbox Modal with Zoom ── */}
      <ImageLightbox image={lightboxImage} onClose={closeLightbox} apiBase={API_BASE} />

    </div>
  );
};

export default TaskOversight;