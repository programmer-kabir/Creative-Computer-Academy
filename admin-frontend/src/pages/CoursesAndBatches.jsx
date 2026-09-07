import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiLayers, FiCalendar, FiClock, FiUsers, FiPlus,
  FiEdit2, FiTrash2, FiX, FiCheck, FiBookOpen, FiAward,
  FiFilter, FiMapPin, FiUserCheck, FiChevronRight, FiGrid, FiList
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_COURSE = {
  id: '',
  title: '',
  course_code: '',
  category: 'Creative & Design',
  description: '',
  duration_months: 3,
  total_classes: 36,
  fee_amount: 0,
  status: 'active'
};

const EMPTY_BATCH = {
  id: '',
  course_id: '',
  batch_code: '',
  batch_name: '',
  lead_instructor_id: '',
  assistant_instructor_id: '',
  lab_room: 'Main Computer Lab',
  schedule_days: 'Sat, Mon, Wed',
  schedule_time: '10:00 AM - 12:00 PM',
  max_capacity: 25,
  start_date: new Date().toISOString().split('T')[0],
  expected_end_date: '',
  status: 'enrolling'
};

const EMPTY_MODULE = {
  id: '',
  course_id: '',
  module_no: 1,
  title: '',
  description: '',
  duration_classes: 6,
  status: 'active'
};

const WEEK_DAYS = [
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
];

const PRESET_DAYS = [
  { label: 'Sat, Mon, Wed', value: 'Sat, Mon, Wed' },
  { label: 'Sun, Tue, Thu', value: 'Sun, Tue, Thu' },
  { label: 'Fri, Sat (Weekend)', value: 'Fri, Sat' },
  { label: 'Daily (All 7 Days)', value: 'Sat, Sun, Mon, Tue, Wed, Thu, Fri' },
];

const TIME_PRESETS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
  '08:00 PM - 10:00 PM'
];

// Convert 24-hour time "HH:mm" to 12-hour formatted "hh:mm AM/PM"
const formatTo12h = (t24) => {
  if (!t24) return '';
  const [hStr, mStr] = t24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const formattedH = h < 10 ? `0${h}` : `${h}`;
  return `${formattedH}:${m} ${ampm}`;
};

// Convert 12-hour formatted string (e.g. "10:00 AM") to 24-hour "HH:mm"
const parse12hTo24h = (str12) => {
  if (!str12) return '';
  const match = str12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let [_, h, m, ampm] = match;
  let hour = parseInt(h, 10);
  if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m}`;
};

const CoursesAndBatches = () => {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'courses' | 'modules'

  // Data states
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [batchStatusFilter, setBatchStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [savingCourse, setSavingCourse] = useState(false);

  // Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [savingBatch, setSavingBatch] = useState(false);

  // Module state
  const [selectedCourseForModules, setSelectedCourseForModules] = useState('');
  const [modules, setModules] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [savingModule, setSavingModule] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [crsRes, batRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}api/admin/courses/get_courses.php`),
        axios.get(`${API_BASE}api/admin/batches/get_batches.php`),
        axios.get(`${API_BASE}api/admin/staff/get_all_staff.php`)
      ]);

      if (crsRes.data.status === 'success') {
        const crsList = crsRes.data.data || [];
        setCourses(crsList);
        if (crsList.length > 0 && !selectedCourseForModules) {
          setSelectedCourseForModules(crsList[0].id);
        }
      }

      if (batRes.data.status === 'success') {
        setBatches(batRes.data.data || []);
      }

      if (empRes.data.status === 'success') {
        setEmployees(empRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading courses & batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch modules when selectedCourseForModules changes
  useEffect(() => {
    if (!selectedCourseForModules) return;
    const fetchModules = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/admin/courses/get_modules.php?course_id=${selectedCourseForModules}`);
        if (res.data.status === 'success') {
          setModules(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchModules();
  }, [selectedCourseForModules]);

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
        fetchData();
      } else {
        toast.error(res.data.message || 'Failed to save course.');
      }
    } catch (err) {
      toast.error('Error saving course.');
    } finally {
      setSavingCourse(false);
    }
  };

  // Save Batch Submit
  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.course_id || !batchForm.batch_name) {
      toast.error('Course and Batch Name are required!');
      return;
    }

    try {
      setSavingBatch(true);
      const res = await axios.post(`${API_BASE}api/admin/batches/save_batch.php`, batchForm);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Batch saved successfully!');
        setShowBatchModal(false);
        setBatchForm(EMPTY_BATCH);
        fetchData();
      } else {
        toast.error(res.data.message || 'Failed to save batch.');
      }
    } catch (err) {
      toast.error('Error saving batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  // Save Module Submit
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title || !selectedCourseForModules) {
      toast.error('Module title is required!');
      return;
    }

    try {
      setSavingModule(true);
      const res = await axios.post(`${API_BASE}api/admin/courses/save_module.php`, {
        ...moduleForm,
        course_id: selectedCourseForModules
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Module saved!');
        setShowModuleModal(false);
        setModuleForm(EMPTY_MODULE);
        // refresh modules
        const modRes = await axios.get(`${API_BASE}api/admin/courses/get_modules.php?course_id=${selectedCourseForModules}`);
        if (modRes.data.status === 'success') setModules(modRes.data.data || []);
        fetchData();
      } else {
        toast.error(res.data.message || 'Failed to save module.');
      }
    } catch (err) {
      toast.error('Error saving module.');
    } finally {
      setSavingModule(false);
    }
  };

  // Filtered Batches
  const filteredBatches = batches.filter(b => {
    const matchCourse = selectedCourseFilter === 'all' || String(b.course_id) === String(selectedCourseFilter);
    const matchStatus = batchStatusFilter === 'all' || b.status === batchStatusFilter;
    const matchSearch =
      !searchQuery ||
      b.batch_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batch_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.course_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.lead_instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCourse && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6  mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
              <FiLayers size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Courses & Batch Engine</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage academy courses, unlimited batch cohorts (Batch 1 to 11+), dynamic modules, and instructor schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button depending on Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'batches' ? (
            <button
              onClick={() => {
                setBatchForm({
                  ...EMPTY_BATCH,
                  course_id: courses[0]?.id || '',
                  batch_code: `BATCH-${Math.floor(10 + Math.random() * 90)}`
                });
                setShowBatchModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <FiPlus size={18} />
              <span>Launch New Batch</span>
            </button>
          ) : activeTab === 'courses' ? (
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
            <button
              onClick={() => {
                setModuleForm({
                  ...EMPTY_MODULE,
                  course_id: selectedCourseForModules,
                  module_no: (modules.length + 1)
                });
                setShowModuleModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <FiPlus size={18} />
              <span>Add Module / Topic</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'batches'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiCalendar size={16} />
          <span>Batches & Cohorts ({batches.length})</span>
        </button>

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
          onClick={() => setActiveTab('modules')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'modules'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiLayers size={16} />
          <span>Curriculum & Modules</span>
        </button>
      </div>

      {/* TAB 1: BATCHES MANAGER */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search batches by name, code, course, instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <select
                value={batchStatusFilter}
                onChange={(e) => setBatchStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="enrolling">Enrolling (Admission Open)</option>
                <option value="running">Running (Classes Active)</option>
                <option value="exam_phase">Exam / Final Projects</option>
                <option value="completed">Completed / Graduated</option>
              </select>
            </div>
          </div>

          {/* Batches Grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold">Loading Batches...</div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 text-slate-400">
              <FiCalendar size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-bold text-slate-600 dark:text-slate-300">No Batches Found</p>
              <p className="text-sm mt-1">Create a new batch to start enrolling students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((b) => {
                const enrolled = parseInt(b.enrolled_students_count || 0);
                const capacity = parseInt(b.max_capacity || 25);
                const seatPercentage = Math.min(100, Math.round((enrolled / capacity) * 100));

                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-6 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                          {b.batch_code}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          b.status === 'running'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : b.status === 'enrolling'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Course & Batch Title */}
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3 leading-snug">
                        {b.batch_name}
                      </h3>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {b.course_title}
                      </p>

                      {/* Schedule & Venue */}
                      <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                          <FiCalendar size={14} className="text-indigo-500 shrink-0" />
                          <span>{b.schedule_days}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                          <FiClock size={14} className="text-indigo-500 shrink-0" />
                          <span>{b.schedule_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                          <FiMapPin size={14} className="text-indigo-500 shrink-0" />
                          <span>{b.lab_room || 'Main Lab'}</span>
                        </div>
                      </div>

                      {/* Instructors */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Instructor</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {b.lead_instructor_name ? `👨‍🏫 ${b.lead_instructor_name}` : 'Not Assigned Yet'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Seat Capacity Meter & Edit */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Seat Enrollment</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                            {enrolled} / {capacity} Students ({seatPercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              seatPercentage >= 100
                                ? 'bg-rose-500'
                                : seatPercentage > 75
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                            }`}
                            style={{ width: `${seatPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setBatchForm(b);
                            setShowBatchModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FiEdit2 size={12} />
                          <span>Edit Batch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSES MASTER */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Duration & Classes</th>
                  <th className="px-6 py-4">Batches</th>
                  <th className="px-6 py-4">Modules</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {courses.map((crs) => (
                  <tr key={crs.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-black flex items-center justify-center shrink-0">
                          {crs.course_code?.slice(0, 2) || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{crs.title}</p>
                          <p className="text-xs font-mono text-slate-400 font-semibold">{crs.course_code}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">
                        {crs.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <p>{crs.duration_months} Months</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{crs.total_classes} Total Classes</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-black">
                        {crs.total_batches_count || 0} Batches
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black">
                        {crs.total_modules_count || 0} Modules
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setCourseForm(crs);
                          setShowCourseModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Course"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CURRICULUM & MODULES */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Select Course dropdown */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiBookOpen size={20} className="text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Select Course to View & Edit Modules</h3>
                <p className="text-xs text-slate-400">Curriculum changes will seamlessly reflect across running and future batches.</p>
              </div>
            </div>

            <select
              value={selectedCourseForModules}
              onChange={(e) => setSelectedCourseForModules(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>
              ))}
            </select>
          </div>

          {/* Module List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.length === 0 ? (
              <div className="col-span-2 p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 text-center text-slate-400">
                <FiLayers size={40} className="mx-auto mb-2 opacity-40" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No modules added for this course yet.</p>
                <p className="text-xs mt-1">Click "Add Module / Topic" above to structure the course syllabus.</p>
              </div>
            ) : (
              modules.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center shrink-0 text-xs">
                      M{m.module_no}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{m.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{m.description || 'Course module topics and hands-on practice.'}</p>
                      <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                        ⏱️ Estimated Classes: {m.duration_classes || 6}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setModuleForm(m);
                      setShowModuleModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Batch Create / Edit Modal */}
      {showBatchModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {batchForm.id ? 'Edit Batch Cohort' : 'Launch New Batch Cohort'}
                  </h2>
                  <p className="text-xs text-slate-400">Configure batch name, schedule, seat limit, and lead instructor.</p>
                </div>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-2 text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course *</label>
                  <CustomSelect
                    value={batchForm.course_id || ''}
                    onChange={(val) => setBatchForm({ ...batchForm, course_id: val })}
                    placeholder="Select Course"
                    icon={FiBookOpen}
                    searchable={true}
                    options={courses.map(c => ({
                      value: c.id,
                      label: c.title,
                      badge: c.course_code
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GD-B11-2026"
                    value={batchForm.batch_code}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphic Design Batch 11 (Morning)"
                  value={batchForm.batch_name}
                  onChange={(e) => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-bold"
                />
              </div>

              {/* Schedule Days (Full Week Interactive Selector) */}
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Schedule Days (Full Week Selection)
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {batchForm.schedule_days || 'No days selected'}
                  </span>
                </div>

                {/* 7 Days of the week interactive pills */}
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map(day => {
                    const activeDays = (batchForm.schedule_days || '').split(',').map(d => d.trim()).filter(Boolean);
                    const isSelected = activeDays.includes(day.short);
                    return (
                      <button
                        key={day.short}
                        type="button"
                        onClick={() => {
                          let updated;
                          if (isSelected) {
                            updated = activeDays.filter(d => d !== day.short);
                          } else {
                            const canonical = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                            updated = canonical.filter(d => activeDays.includes(d) || d === day.short);
                          }
                          setBatchForm({ ...batchForm, schedule_days: updated.join(', ') });
                        }}
                        title={day.full}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 scale-100 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                        }`}
                      >
                        <span className="text-xs font-black">{day.short}</span>
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {day.full.slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                  {PRESET_DAYS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, schedule_days: p.value })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                        batchForm.schedule_days === p.value
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot (Class Timing & Flexible Time Picker) */}
              <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time Slot / Class Timing (যেকোনো সময় কাস্টমাইজ করুন)
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {batchForm.schedule_time || 'Not specified'}
                  </span>
                </div>

                {/* Start & End Time Pickers */}
                {(() => {
                  const parts = (batchForm.schedule_time || '').split('-').map(s => s.trim());
                  const startTime12 = parts[0] || '10:00 AM';
                  const endTime12 = parts[1] || '12:00 PM';
                  const startTime24 = parse12hTo24h(startTime12) || '10:00';
                  const endTime24 = parse12hTo24h(endTime12) || '12:00';

                  const handleStartTime = (val24) => {
                    if (!val24) return;
                    const new12 = formatTo12h(val24);
                    setBatchForm({ ...batchForm, schedule_time: `${new12} - ${endTime12}` });
                  };

                  const handleEndTime = (val24) => {
                    if (!val24) return;
                    const new12 = formatTo12h(val24);
                    setBatchForm({ ...batchForm, schedule_time: `${startTime12} - ${new12}` });
                  };

                  const handleAddDuration = (hours) => {
                    const [hStr, mStr] = startTime24.split(':');
                    const totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + Math.round(hours * 60);
                    const newH = Math.floor(totalMins / 60) % 24;
                    const newM = totalMins % 60;
                    const new24 = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                    const newEnd12 = formatTo12h(new24);
                    setBatchForm({ ...batchForm, schedule_time: `${startTime12} - ${newEnd12}` });
                  };

                  return (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            ⏰ Start Time
                          </label>
                          <input
                            type="time"
                            value={startTime24}
                            onChange={(e) => handleStartTime(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold dark:text-white cursor-pointer focus:outline-hidden"
                          />
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            🏁 End Time
                          </label>
                          <input
                            type="time"
                            value={endTime24}
                            onChange={(e) => handleEndTime(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold dark:text-white cursor-pointer focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Quick Duration Adders */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration:</span>
                        {[1, 1.5, 2, 2.5, 3].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleAddDuration(h)}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold transition-all cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                          >
                            +{h} Hr{h > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Direct Manual Text Box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Custom Time Format / Direct Edit:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 12:00 PM or 03:30 PM - 05:30 PM"
                    value={batchForm.schedule_time}
                    onChange={(e) => setBatchForm({ ...batchForm, schedule_time: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white font-mono"
                  />
                </div>

                {/* Common Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Common Slots:</span>
                  {TIME_PRESETS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, schedule_time: slot })}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                        batchForm.schedule_time === slot
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Seats Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={batchForm.max_capacity}
                    onChange={(e) => setBatchForm({ ...batchForm, max_capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lab / Venue</label>
                  <input
                    type="text"
                    value={batchForm.lab_room}
                    onChange={(e) => setBatchForm({ ...batchForm, lab_room: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Status</label>
                  <CustomSelect
                    value={batchForm.status}
                    onChange={(val) => setBatchForm({ ...batchForm, status: val })}
                    placeholder="Select Status"
                    icon={FiLayers}
                    searchable={false}
                    options={[
                      { value: 'enrolling', label: 'Enrolling', dot: 'bg-blue-500' },
                      { value: 'running', label: 'Running', dot: 'bg-emerald-500' },
                      { value: 'exam_phase', label: 'Exam / Projects', dot: 'bg-purple-500' },
                      { value: 'completed', label: 'Completed', dot: 'bg-slate-400' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lead Instructor (Staff)</label>
                <CustomSelect
                  value={batchForm.lead_instructor_id || ''}
                  onChange={(val) => setBatchForm({ ...batchForm, lead_instructor_id: val })}
                  placeholder="Select Instructor"
                  icon={FiUserCheck}
                  searchable={true}
                  options={[
                    { value: '', label: 'None / Select Instructor' },
                    ...employees.map(emp => ({
                      value: emp.id,
                      label: emp.name,
                      subtext: emp.designation || 'Staff Member',
                      badge: emp.employee_code || null
                    }))
                  ]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-5 py-2 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBatch}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {savingBatch ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Course Create / Edit Modal */}
      {showCourseModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {courseForm.id ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphic Design & Multimedia"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="GD-101"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Creative / Programming"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.duration_months}
                    onChange={(e) => setCourseForm({ ...courseForm, duration_months: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Classes</label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.total_classes}
                    onChange={(e) => setCourseForm({ ...courseForm, total_classes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Course Description</label>
                <textarea
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {savingCourse ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 3: Module Create / Edit Modal */}
      {showModuleModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {moduleForm.id ? 'Edit Module' : 'Add Course Module'}
              </h3>
              <button onClick={() => setShowModuleModal(false)} className="p-1 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module No</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.module_no}
                    onChange={(e) => setModuleForm({ ...moduleForm, module_no: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Classes Count</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.duration_classes}
                    onChange={(e) => setModuleForm({ ...moduleForm, duration_classes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Photoshop Fundamentals & Tools"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Topics / Description</label>
                <textarea
                  rows={3}
                  placeholder="Key topics and deliverables taught in this module..."
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModule}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {savingModule ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CoursesAndBatches;
