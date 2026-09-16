import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiLayers, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiBookOpen,
  FiAward, FiFilter, FiUserCheck, FiChevronRight, FiChevronDown,
  FiGrid, FiList, FiPlay, FiClock, FiVideo, FiFileText, FiLink,
  FiExternalLink, FiEye, FiPaperclip
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_COURSE = {
  id: '',
  title: '',
  course_code: '',
  category: 'Creative & Design',
  thumbnail_url: '',
  banner_url: '',
  description: '',
  duration_months: 3,
  total_classes: 36,
  fee_amount: 0,
  status: 'active'
};

const EMPTY_MILESTONE = {
  id: '',
  course_id: '',
  milestone_no: 1,
  title: '',
  description: '',
  order_index: 1,
  status: 'active'
};

const EMPTY_MODULE = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_no: 1,
  title: '',
  description: '',
  duration_classes: 6,
  status: 'active'
};

const EMPTY_LESSON = {
  id: '',
  course_id: '',
  milestone_id: '',
  module_id: '',
  lesson_no: 1,
  title: '',
  video_type: 'youtube',
  video_url: '',
  duration_minutes: '10:00',
  summary: '',
  resources_json: '[]',
  is_free_preview: 0,
  status: 'active'
};

const CoursesAndCurriculum = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'curriculum'

  // Data states
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [savingCourse, setSavingCourse] = useState(false);

  // Curriculum Tree State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [curriculumData, setCurriculumData] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  // Milestone Modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE);
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Module Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [savingModule, setSavingModule] = useState(false);

  // Lesson Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [savingLesson, setSavingLesson] = useState(false);
  const [resourceInputs, setResourceInputs] = useState([{ title: '', url: '' }]);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');

  // Fetch initial courses list
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const crsRes = await axios.get(`${API_BASE}api/admin/courses/get_courses.php`);
      if (crsRes.data.status === 'success') {
        const crsList = crsRes.data.data || [];
        setCourses(crsList);
        if (crsList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(crsList[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch full curriculum when selectedCourseId changes or when switching to curriculum tab
  const fetchCurriculum = async (cId = selectedCourseId) => {
    if (!cId) return;
    try {
      setLoadingCurriculum(true);
      const res = await axios.get(`${API_BASE}api/student/courses/get_course_curriculum.php?course_id=${cId}`);
      if (res.data.status === 'success' && res.data.data) {
        setCurriculumData(res.data.data);

        // Expand all by default
        const mExp = {};
        const modExp = {};
        (res.data.data.milestones || []).forEach(ms => {
          mExp[ms.id] = true;
          (ms.modules || []).forEach(mod => {
            modExp[mod.id] = true;
          });
        });
        setExpandedMilestones(mExp);
        setExpandedModules(modExp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCurriculum(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Save Course Submit
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title) {
      toast.error('Course title is required!');
      return;
    }

    try {
      setSavingCourse(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/save_course.php`, courseForm);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Course saved successfully!');
        setShowCourseModal(false);
        setCourseForm(EMPTY_COURSE);
        fetchCourses();
      } else {
        toast.error(res.data.message || 'Failed to save course.');
      }
    } catch (err) {
      toast.error('Error saving course.');
    } finally {
      setSavingCourse(false);
    }
  };

  // Save Milestone Submit
  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title || !selectedCourseId) {
      toast.error('Milestone title and course are required!');
      return;
    }

    try {
      setSavingMilestone(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/milestones/save_milestone.php`, {
        ...milestoneForm,
        course_id: selectedCourseId
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Milestone saved!');
        setShowMilestoneModal(false);
        setMilestoneForm(EMPTY_MILESTONE);
        fetchCurriculum(selectedCourseId);
      } else {
        toast.error(res.data.message || 'Failed to save milestone.');
      }
    } catch (err) {
      toast.error('Error saving milestone.');
    } finally {
      setSavingMilestone(false);
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = async (mId) => {
    if (!window.confirm('Are you sure you want to delete this milestone? Associated modules will become unassigned.')) return;
    try {
      const res = await axios.post(`${API_BASE}api/admin/courses/milestones/delete_milestone.php`, { id: mId });
      if (res.data.status === 'success') {
        toast.success('Milestone deleted.');
        fetchCurriculum(selectedCourseId);
      }
    } catch (err) {
      toast.error('Failed to delete milestone.');
    }
  };

  // Save Module Submit
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title || !selectedCourseId) {
      toast.error('Module title is required!');
      return;
    }

    try {
      setSavingModule(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/save_module.php`, {
        ...moduleForm,
        course_id: selectedCourseId
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Module saved!');
        setShowModuleModal(false);
        setModuleForm(EMPTY_MODULE);
        fetchCurriculum(selectedCourseId);
      } else {
        toast.error(res.data.message || 'Failed to save module.');
      }
    } catch (err) {
      toast.error('Error saving module.');
    } finally {
      setSavingModule(false);
    }
  };

  // Save Lesson Submit
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title || !lessonForm.video_url || !lessonForm.module_id) {
      toast.error('Module, Lesson Title, and Video URL are required!');
      return;
    }

    const filteredResources = resourceInputs.filter(r => r.title.trim() && r.url.trim());

    try {
      setSavingLesson(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/lessons/save_lesson.php`, {
        ...lessonForm,
        course_id: selectedCourseId,
        resources_json: JSON.stringify(filteredResources)
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Video lesson saved!');
        setShowLessonModal(false);
        setLessonForm(EMPTY_LESSON);
        fetchCurriculum(selectedCourseId);
      } else {
        toast.error(res.data.message || 'Failed to save lesson.');
      }
    } catch (err) {
      toast.error('Error saving lesson.');
    } finally {
      setSavingLesson(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lId) => {
    if (!window.confirm('Delete this video lesson?')) return;
    try {
      const res = await axios.post(`${API_BASE}api/admin/courses/lessons/delete_lesson.php`, { id: lId });
      if (res.data.status === 'success') {
        toast.success('Lesson deleted.');
        fetchCurriculum(selectedCourseId);
      }
    } catch (err) {
      toast.error('Failed to delete lesson.');
    }
  };

  const openAddLessonModal = (mod, ms) => {
    const existingCount = (mod.lessons || []).length;
    setLessonForm({
      ...EMPTY_LESSON,
      course_id: selectedCourseId,
      milestone_id: ms?.id || mod.milestone_id || '',
      module_id: mod.id,
      lesson_no: existingCount + 1
    });
    setResourceInputs([{ title: '', url: '' }]);
    setShowLessonModal(true);
  };

  const openEditLessonModal = (les) => {
    setLessonForm({
      ...les,
      resources_json: JSON.stringify(les.resources || [])
    });
    setResourceInputs(les.resources && les.resources.length > 0 ? les.resources : [{ title: '', url: '' }]);
    setShowLessonModal(true);
  };

  const filteredCourses = courses.filter(c => {
    const matchCat = selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;
    const matchSearch =
      !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));

  return (
    <div className="space-y-6 mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <FiBookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Courses & Curriculum Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage self-paced programs with Milestones, Modules, and 5-9 Video Lessons per topic.
            </p>
          </div>
        </div>

        {/* Action Button depending on Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'courses' ? (
            <button
              onClick={() => {
                setCourseForm({
                  ...EMPTY_COURSE,
                  course_code: `CRS-${Math.floor(100 + Math.random() * 900)}`
                });
                setShowCourseModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <FiPlus size={18} />
              <span>Create New Course</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const msList = curriculumData?.milestones || [];
                  setMilestoneForm({
                    ...EMPTY_MILESTONE,
                    course_id: selectedCourseId,
                    milestone_no: msList.length + 1
                  });
                  setShowMilestoneModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer text-xs"
              >
                <FiPlus size={16} />
                <span>Add Milestone</span>
              </button>
              <button
                onClick={() => {
                  const msList = curriculumData?.milestones || [];
                  const defaultMId = msList.length > 0 ? msList[0].id : '';
                  setModuleForm({
                    ...EMPTY_MODULE,
                    course_id: selectedCourseId,
                    milestone_id: defaultMId,
                    module_no: 1
                  });
                  setShowModuleModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer text-xs"
              >
                <FiPlus size={16} />
                <span>Add Module</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiBookOpen size={16} />
          <span>Courses Master ({courses.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('curriculum');
            if (selectedCourseId) fetchCurriculum(selectedCourseId);
          }}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'curriculum'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiLayers size={16} />
          <span>Curriculum Studio (Milestones & Videos)</span>
        </button>
      </div>

      {/* TAB 1: Courses Master */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Categories
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Duration & Classes</th>
                    <th className="px-6 py-4">Modules</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.thumbnail_url ? (
                            <img src={c.thumbnail_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black flex items-center justify-center text-xs">
                              {c.course_code?.slice(0, 3) || 'CRS'}
                            </div>
                          )}
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{c.title}</p>
                            <p className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{c.course_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{c.duration_months} Months</p>
                        <p className="text-xs text-slate-400">{c.total_classes} Classes</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {c.total_modules_count || 0} Modules
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCourseId(c.id);
                              setActiveTab('curriculum');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <FiLayers size={13} />
                            <span>Curriculum</span>
                          </button>
                          <button
                            onClick={() => {
                              setCourseForm(c);
                              setShowCourseModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-purple-600 rounded-lg cursor-pointer transition-colors"
                          >
                            <FiEdit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Curriculum Studio (Milestones -> Modules -> 5-9 Video Lessons) */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Course Selector Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Active Course:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>🏆 {curriculumData?.stats?.total_milestones || 0} Milestones</span>
              <span>📁 {curriculumData?.stats?.total_modules || 0} Modules</span>
              <span className="text-indigo-600 dark:text-indigo-400">🎬 {curriculumData?.stats?.total_lessons || 0} Video Lessons</span>
            </div>
          </div>

          {/* Curriculum Tree View */}
          {loadingCurriculum ? (
            <div className="p-12 text-center text-slate-400 font-bold">Loading curriculum tree...</div>
          ) : (
            <div className="space-y-4">
              {(curriculumData?.milestones || []).length === 0 ? (
                <div className="p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 text-center space-y-3">
                  <FiLayers size={40} className="mx-auto text-slate-400 opacity-50" />
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Milestones Added Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Start by adding Milestone 1 to group your course modules and 5-9 video lessons.
                  </p>
                  <button
                    onClick={() => {
                      setMilestoneForm({ ...EMPTY_MILESTONE, course_id: selectedCourseId, milestone_no: 1 });
                      setShowMilestoneModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700"
                  >
                    + Create First Milestone
                  </button>
                </div>
              ) : (
                (curriculumData?.milestones || []).map((ms, msIdx) => {
                  const isMsOpen = !!expandedMilestones[ms.id];
                  return (
                    <div
                      key={ms.id || msIdx}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs"
                    >
                      {/* Milestone Header */}
                      <div className="p-5 bg-gradient-to-r from-indigo-950/20 via-slate-900/10 to-transparent dark:from-indigo-950/40 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div
                          onClick={() => setExpandedMilestones(prev => ({ ...prev, [ms.id]: !prev[ms.id] }))}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <span className="p-2 rounded-xl bg-indigo-600 text-white font-black text-xs shrink-0">
                            M{ms.milestone_no || msIdx + 1}
                          </span>
                          <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{ms.title}</span>
                              <span className="text-xs font-normal text-slate-400">
                                ({ms.modules?.length || 0} Modules • {ms.total_lessons || 0} Lessons)
                              </span>
                            </h3>
                            {ms.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ms.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Milestone Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setModuleForm({
                                ...EMPTY_MODULE,
                                course_id: selectedCourseId,
                                milestone_id: ms.id,
                                module_no: (ms.modules?.length || 0) + 1
                              });
                              setShowModuleModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus size={13} />
                            <span>Add Module</span>
                          </button>

                          <button
                            onClick={() => {
                              setMilestoneForm(ms);
                              setShowMilestoneModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                            title="Edit Milestone"
                          >
                            <FiEdit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Delete Milestone"
                          >
                            <FiTrash2 size={14} />
                          </button>

                          <button
                            onClick={() => setExpandedMilestones(prev => ({ ...prev, [ms.id]: !prev[ms.id] }))}
                            className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                          >
                            {isMsOpen ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Modules & Lessons under this Milestone */}
                      {isMsOpen && (
                        <div className="p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
                          {(ms.modules || []).length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No modules added in this milestone yet. Click "+ Add Module" above.
                            </div>
                          ) : (
                            (ms.modules || []).map((mod, modIdx) => {
                              const isModOpen = !!expandedModules[mod.id];
                              const lessonsList = mod.lessons || [];

                              return (
                                <div
                                  key={mod.id || modIdx}
                                  className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs"
                                >
                                  {/* Module Header */}
                                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/50">
                                    <div
                                      onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                      className="flex items-center gap-3 cursor-pointer flex-1"
                                    >
                                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center text-xs shrink-0">
                                        M{mod.module_no}
                                      </div>
                                      <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                          {mod.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400">
                                          {lessonsList.length} Video Lessons ({lessonsList.length >= 5 ? '✅ Standard 5-9 Set' : `${5 - lessonsList.length} more recommended`})
                                        </p>
                                      </div>
                                    </div>

                                    {/* Module Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => openAddLessonModal(mod, ms)}
                                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <FiPlus size={13} />
                                        <span>Add Video Lesson</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setModuleForm(mod);
                                          setShowModuleModal(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                                        title="Edit Module"
                                      >
                                        <FiEdit2 size={13} />
                                      </button>

                                      <button
                                        onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                                      >
                                        {isModOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* 5-9 Video Lessons Table */}
                                  {isModOpen && (
                                    <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60">
                                      {lessonsList.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">
                                          No video classes added yet. Click "+ Add Video Lesson" to add the 5-9 video lectures.
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {lessonsList.map((les, lIdx) => (
                                            <div
                                              key={les.id}
                                              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                                            >
                                              <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-black flex items-center justify-center text-[10px] shrink-0">
                                                  {les.lesson_no || lIdx + 1}
                                                </span>
                                                <div className="min-w-0">
                                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                                    {les.title}
                                                  </p>
                                                  <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span className="flex items-center gap-1 font-mono">
                                                      <FiClock size={11} />
                                                      {les.duration_minutes}
                                                    </span>
                                                    <span className="uppercase font-bold text-indigo-500">
                                                      [{les.video_type}]
                                                    </span>
                                                    {les.is_free_preview && (
                                                      <span className="text-amber-500 font-bold">★ Free Preview</span>
                                                    )}
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Lesson Actions */}
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                  onClick={() => setPreviewVideoUrl(les.video_url)}
                                                  className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg cursor-pointer"
                                                  title="Preview Video"
                                                >
                                                  <FiEye size={14} />
                                                </button>
                                                <button
                                                  onClick={() => openEditLessonModal(les)}
                                                  className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg cursor-pointer"
                                                  title="Edit Lesson"
                                                >
                                                  <FiEdit2 size={14} />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteLesson(les.id)}
                                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                                  title="Delete Lesson"
                                                >
                                                  <FiTrash2 size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Course Create / Edit */}
      {showCourseModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-xl">
                  <FiBookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {courseForm.id ? 'Edit Course' : 'Create New Course'}
                  </h2>
                  <p className="text-xs text-slate-400">Configure course details, duration, category, and total classes.</p>
                </div>
              </div>
              <button onClick={() => setShowCourseModal(false)} className="p-2 text-slate-400 hover:text-white cursor-pointer">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphic Design & Multimedia Masterclass"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GDM-101"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer"
                  >
                    <option value="Creative & Design">Creative & Design</option>
                    <option value="Web & Software">Web & Software</option>
                    <option value="Office & Productivity">Office & Productivity</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Database & Systems">Database & Systems</option>
                  </select>
                </div>
              </div>

              {/* Picture (1:1) and Banner (16:9) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Course Picture URL (Square 1:1)
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../pic.png (Avatar)"
                    value={courseForm.thumbnail_url || ''}
                    onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                  {courseForm.thumbnail_url && (
                    <img src={courseForm.thumbnail_url} alt="" className="w-12 h-12 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Course Banner URL (Wide 16:9 Cover)
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../banner.jpg (Cover)"
                    value={courseForm.banner_url || ''}
                    onChange={(e) => setCourseForm({ ...courseForm, banner_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                  {courseForm.banner_url && (
                    <img src={courseForm.banner_url} alt="" className="w-full h-12 rounded-xl object-cover mt-2 border border-slate-700" />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingCourse ? 'Saving...' : courseForm.id ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Milestone Create / Edit */}
      {showMilestoneModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {milestoneForm.id ? 'Edit Milestone' : 'Add Course Milestone'}
              </h2>
              <button onClick={() => setShowMilestoneModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Milestone No *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={milestoneForm.milestone_no}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_no: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1: Web Foundation & HTML/CSS"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Goal</label>
                <textarea
                  rows="3"
                  placeholder="Core achievement goals in this milestone..."
                  value={milestoneForm.description || ''}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingMilestone} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingMilestone ? 'Saving...' : milestoneForm.id ? 'Update Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Module Create / Edit */}
      {showModuleModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {moduleForm.id ? 'Edit Module' : 'Add Course Module'}
              </h2>
              <button onClick={() => setShowModuleModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign to Milestone</label>
                <select
                  value={moduleForm.milestone_id || ''}
                  onChange={(e) => setModuleForm({ ...moduleForm, milestone_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer font-bold"
                >
                  <option value="">-- Select Milestone --</option>
                  {(curriculumData?.milestones || []).map(m => (
                    <option key={m.id} value={m.id}>M{m.milestone_no}: {m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module No *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moduleForm.module_no}
                  onChange={(e) => setModuleForm({ ...moduleForm, module_no: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 01: CSS Box Model & Modern Flexbox"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingModule} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingModule ? 'Saving...' : moduleForm.id ? 'Update Module' : 'Add Module'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Video Lesson Create / Edit */}
      {showLessonModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                  <FiVideo size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {lessonForm.id ? 'Edit Video Lesson' : 'Add Video Lesson'}
                  </h2>
                  <p className="text-xs text-slate-400">Provide video class lecture URL, duration, notes, and asset links.</p>
                </div>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lesson No</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lessonForm.lesson_no}
                    onChange={(e) => setLessonForm({ ...lessonForm, lesson_no: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Video Type</label>
                  <select
                    value={lessonForm.video_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer font-bold"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="drive">Google Drive</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="direct">Direct MP4 Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (min)</label>
                  <input
                    type="text"
                    placeholder="12:30"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-1 Introduction to Modern Flexbox & Container Properties"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Video URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or Drive preview URL"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lecture Notes & Summary</label>
                <textarea
                  rows="3"
                  placeholder="Detailed breakdown, key takeaways, practice instructions..."
                  value={lessonForm.summary || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                ></textarea>
              </div>

              {/* Resource Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloadable Resources</label>
                  <button
                    type="button"
                    onClick={() => setResourceInputs([...resourceInputs, { title: '', url: '' }])}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-400 cursor-pointer"
                  >
                    + Add File Link
                  </button>
                </div>
                <div className="space-y-2">
                  {resourceInputs.map((res, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Resource Title (e.g. Cheat Sheet PDF)"
                        value={res.title}
                        onChange={(e) => {
                          const copy = [...resourceInputs];
                          copy[idx].title = e.target.value;
                          setResourceInputs(copy);
                        }}
                        className="w-1/2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={res.url}
                        onChange={(e) => {
                          const copy = [...resourceInputs];
                          copy[idx].url = e.target.value;
                          setResourceInputs(copy);
                        }}
                        className="w-1/2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="freePreviewCheck"
                  checked={!!lessonForm.is_free_preview}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked ? 1 : 0 })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="freePreviewCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allow Free Preview (Available to non-enrolled students)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowLessonModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400">
                  Cancel
                </button>
                <button type="submit" disabled={savingLesson} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md">
                  {savingLesson ? 'Saving...' : lessonForm.id ? 'Update Video Lesson' : 'Add Video Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">Video Link Preview</span>
              <button onClick={() => setPreviewVideoUrl('')} className="p-1.5 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={previewVideoUrl.replace('watch?v=', 'embed/')}
                title="Preview"
                className="w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CoursesAndCurriculum;
