import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiPlay, FiCheckCircle, FiCircle, FiChevronDown, FiChevronRight,
  FiBookOpen, FiDownload, FiArrowLeft, FiArrowRight, FiAward,
  FiClock, FiFileText, FiLayers, FiHelpCircle, FiMaximize2,
  FiMenu, FiX, FiCheck, FiExternalLink, FiLock
} from 'react-icons/fi';
import { HiSparkles, HiAcademicCap } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import CustomLMSPlayer from '../components/CustomLMSPlayer';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper to format/embed YouTube, Vimeo, Drive, or MP4 URLs
const getEmbedUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
  }

  // Google Drive match
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return trimmed;
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return trimmed;
};

export const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CoursePlayer = () => {
  const { courseSlug, lessonSlug, courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeCourse, courses, selectCourse } = useCourse();

  // State
  const [curriculumData, setCurriculumData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [markingComplete, setMarkingComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'resources'

  const effectiveCourseIdentifier = courseSlug || courseId || activeCourse?.slug || activeCourse?.course_id || (courses.length > 0 ? (courses[0].slug || courses[0].course_id) : null);

  // Fetch full curriculum tree
  const fetchCurriculum = async (targetIdentifier) => {
    if (!targetIdentifier) return;
    try {
      setLoading(true);
      const userParam = currentUser?.id ? `&user_id=${currentUser.id}` : '';
      const res = await axios.get(`${API_BASE}api/student/courses/get_course_curriculum.php?course_id=${encodeURIComponent(targetIdentifier)}${userParam}`);

      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setCurriculumData(data);

        // Auto expand all milestones and modules
        const mExp = {};
        const modExp = {};
        (data.milestones || []).forEach(ms => {
          mExp[ms.id] = true;
          (ms.modules || []).forEach(mod => {
            modExp[mod.id] = true;
          });
        });
        setExpandedMilestones(mExp);
        setExpandedModules(modExp);

        // Flatten all lessons
        const allFlatLessons = [];
        (data.milestones || []).forEach(ms => {
          (ms.modules || []).forEach(mod => {
            (mod.lessons || []).forEach(l => {
              allFlatLessons.push(l);
            });
          });
        });

        // Find active lesson (by URL lessonSlug, or server active_lesson_id/slug, or first lesson)
        let foundLesson = null;
        if (lessonSlug) {
          foundLesson = allFlatLessons.find(l => l.slug === lessonSlug || String(l.id) === String(lessonSlug));
        }

        if (!foundLesson) {
          const targetLessonId = data.stats?.active_lesson_id;
          const targetLessonSlug = data.stats?.active_lesson_slug;
          if (targetLessonSlug) {
            foundLesson = allFlatLessons.find(l => l.slug === targetLessonSlug);
          } else if (targetLessonId) {
            foundLesson = allFlatLessons.find(l => l.id === targetLessonId);
          }
        }

        if (!foundLesson && allFlatLessons.length > 0) {
          foundLesson = allFlatLessons[0];
        }

        setActiveLesson(foundLesson);

        // Sync clean browser URL
        if (foundLesson && data.course) {
          const cSlug = data.course.slug || slugify(data.course.title);
          const lSlug = foundLesson.slug || `lesson-${foundLesson.id}`;
          window.history.replaceState(null, '', `/courses/${cSlug}/learn/${lSlug}`);
        }
      } else {
        toast.error(res.data.message || 'Failed to load course curriculum.');
      }
    } catch (err) {
      console.error('Curriculum error:', err);
      toast.error('Network error loading course content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveCourseIdentifier) {
      fetchCurriculum(effectiveCourseIdentifier);
    }
  }, [effectiveCourseIdentifier, currentUser?.id]);

  // Flatten all lessons in order for Next/Previous buttons
  const allLessonsList = useMemo(() => {
    if (!curriculumData?.milestones) return [];
    const list = [];
    curriculumData.milestones.forEach(ms => {
      (ms.modules || []).forEach(mod => {
        (mod.lessons || []).forEach(les => {
          list.push({ ...les, milestoneTitle: ms.title, moduleTitle: mod.title });
        });
      });
    });
    return list;
  }, [curriculumData]);

  // Compute Unlocked Status: Lesson 0 is always unlocked; subsequent lessons unlock if previous is completed
  const unlockedLessonIds = useMemo(() => {
    const map = {};
    if (allLessonsList.length > 0) {
      // First lesson in course is always unlocked
      map[allLessonsList[0].id] = true;
      for (let i = 0; i < allLessonsList.length; i++) {
        const currentL = allLessonsList[i];
        if (currentL.is_completed) {
          map[currentL.id] = true;
          // Unlock the immediately next lesson in sequence
          if (i + 1 < allLessonsList.length) {
            map[allLessonsList[i + 1].id] = true;
          }
        }
      }
    }
    return map;
  }, [allLessonsList]);

  // Select lesson & update clean URL in browser address bar (Enforces Lock)
  const handleSelectLesson = (les) => {
    const isUnlocked = !!unlockedLessonIds[les.id];
    if (!isUnlocked) {
      toast.warning('🔒 This lesson is locked. Please complete the previous lesson first!');
      return;
    }
    setActiveLesson(les);
    const cSlug = curriculumData?.course?.slug || slugify(curriculumData?.course?.title) || 'course';
    const lSlug = les.slug || `lesson-${les.id}`;
    window.history.replaceState(null, '', `/courses/${cSlug}/learn/${lSlug}`);
  };

  const currentIndex = allLessonsList.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessonsList[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessonsList.length - 1 ? allLessonsList[currentIndex + 1] : null;

  // Toggle Lesson Completion
  const handleToggleComplete = async (lesson, markAs = !lesson.is_completed) => {
    const courseIdNum = curriculumData?.course?.id || activeCourse?.course_id || activeCourse?.id;
    if (!currentUser?.id || !courseIdNum) {
      toast.error('Please log in to track your learning progress.');
      return;
    }

    try {
      setMarkingComplete(true);
      const res = await axios.post(`${API_BASE}api/student/courses/update_lesson_progress.php`, {
        user_id: currentUser.id,
        course_id: courseIdNum,
        lesson_id: lesson.id,
        is_completed: markAs ? 1 : 0
      });

      if (res.data.status === 'success') {
        toast.success(markAs ? '🎉 Class completed! Next class unlocked 🔓' : 'Progress updated.');
        
        // Optimistically update curriculumData state
        setCurriculumData(prev => {
          if (!prev) return prev;
          let completedDelta = 0;
          const updatedMilestones = prev.milestones.map(ms => ({
            ...ms,
            modules: ms.modules.map(mod => ({
              ...mod,
              lessons: mod.lessons.map(l => {
                if (l.id === lesson.id) {
                  if (l.is_completed !== markAs) {
                    completedDelta = markAs ? 1 : -1;
                  }
                  return { ...l, is_completed: markAs };
                }
                return l;
              })
            }))
          }));

          const newCompleted = Math.max(0, (prev.stats.completed_lessons || 0) + completedDelta);
          const newPercent = prev.stats.total_lessons > 0 ? Math.round((newCompleted / prev.stats.total_lessons) * 100) : 0;

          return {
            ...prev,
            milestones: updatedMilestones,
            stats: {
              ...prev.stats,
              completed_lessons: newCompleted,
              progress_percent: newPercent
            }
          };
        });

        if (activeLesson?.id === lesson.id) {
          setActiveLesson(prev => ({ ...prev, is_completed: markAs }));
        }
      }
    } catch (err) {
      toast.error('Failed to update lesson progress.');
    } finally {
      setMarkingComplete(false);
    }
  };

  const toggleMilestone = (mId) => {
    setExpandedMilestones(prev => ({ ...prev, [mId]: !prev[mId] }));
  };

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading your video classroom...</p>
      </div>
    );
  }

  const course = curriculumData?.course;
  const stats = curriculumData?.stats || { progress_percent: 0, completed_lessons: 0, total_lessons: 0 };
  const embedUrl = activeLesson ? getEmbedUrl(activeLesson.video_url) : '';
  const isDirectMp4 = activeLesson?.video_url?.endsWith('.mp4');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <FiArrowLeft size={16} />
            <span className="hidden sm:inline">All Courses</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            {course?.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-800" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FiBookOpen size={16} />
              </div>
            )}
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white line-clamp-1">
                {course?.title || 'Learning Classroom'}
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <span className="text-amber-400 font-bold">{course?.course_code || 'CCA'}</span> • {stats.total_lessons} Lessons
              </p>
            </div>
          </div>
        </div>

        {/* Progress & Sidebar Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <div className="w-28 sm:w-36 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${stats.progress_percent}%` }}
              ></div>
            </div>
            <span className="text-xs font-black text-emerald-400">
              {stats.progress_percent}% <span className="text-[10px] text-slate-400 font-medium">({stats.completed_lessons}/{stats.total_lessons})</span>
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700/80 cursor-pointer"
            title={sidebarOpen ? "Hide Curriculum Drawer" : "Show Curriculum Drawer"}
          >
            <FiLayers size={16} className="text-indigo-400" />
            <span className="hidden sm:inline">{sidebarOpen ? 'Curriculum' : 'Lessons'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Video Player + Left/Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Video Player & Lecture Materials */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeLesson ? (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Custom LMS Video Player Component */}
              <div className="space-y-4">
                <CustomLMSPlayer
                  videoUrl={activeLesson.video_url}
                  title={activeLesson.title}
                  watermarkText={currentUser?.email || currentUser?.student_info?.student_code || 'programmerkabirr@gmail.com'}
                  onPrev={() => prevLesson && handleSelectLesson(prevLesson)}
                  onNext={() => nextLesson && handleSelectLesson(nextLesson)}
                  hasPrev={!!prevLesson}
                  hasNext={!!nextLesson}
                  onEnded={() => handleToggleComplete(activeLesson, true)}
                />

                {/* Bottom Navigation Buttons (Exactly Matching Screenshot!) */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Lesson {activeLesson.lesson_no}
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-white truncate max-w-md">
                      {activeLesson.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleComplete(activeLesson, !activeLesson.is_completed)}
                      disabled={markingComplete}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeLesson.is_completed
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {activeLesson.is_completed ? (
                        <>
                          <FiCheckCircle size={15} className="text-emerald-400" />
                          <span>Completed ✅</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={15} />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>

                    {/* Previous Button (Dark Outline - matching screenshot) */}
                    <button
                      onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                      disabled={!prevLesson}
                      className={`px-6 py-2.5 rounded-xl border border-indigo-500/40 bg-slate-900/90 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                        !prevLesson ? 'opacity-40 cursor-not-allowed border-slate-800' : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Next Button (Light Violet / Purple Gradient - Lock Aware) */}
                    <button
                      onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                      disabled={!nextLesson || !unlockedLessonIds[nextLesson.id]}
                      className={`px-8 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
                        !nextLesson || !unlockedLessonIds[nextLesson.id]
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700/60'
                          : 'bg-gradient-to-r from-purple-300 via-violet-300 to-purple-200 hover:from-purple-200 hover:to-violet-200 text-slate-950 shadow-purple-500/20 hover:scale-[1.03] active:scale-[0.97]'
                      }`}
                      title={!unlockedLessonIds[nextLesson?.id] ? "Complete current class to unlock next class" : "Go to next class"}
                    >
                      <span>Next</span>
                      {!unlockedLessonIds[nextLesson?.id] && nextLesson && <FiLock size={13} className="text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Tabs: Summary / Downloadable Resources */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'notes'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FiFileText size={14} />
                    <span>Lesson Notes & Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'resources'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FiDownload size={14} />
                    <span>Class Resources ({activeLesson.resources?.length || 0})</span>
                  </button>
                </div>

                {activeTab === 'notes' && (
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                    <p>{activeLesson.summary || 'No detailed lecture summary added for this video. Follow along with the instructor step by step!'}</p>
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-3">
                      <HiSparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Pro Tip for Learners</p>
                        <p className="mt-0.5 text-indigo-300">Practice while watching! Open your editor/tools side by side and complete the code tasks before moving to the next class.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-3">
                    {activeLesson.resources && activeLesson.resources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeLesson.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FiDownload size={16} />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {res.title || `Resource File #${rIdx + 1}`}
                                </p>
                                <p className="text-[10px] text-slate-400">Click to download asset</p>
                              </div>
                            </div>
                            <FiExternalLink size={14} className="text-slate-400 group-hover:text-indigo-400" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No downloadable assets attached to this class.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <FiBookOpen size={48} className="mx-auto text-slate-600" />
              <h3 className="text-lg font-bold text-slate-300">No Lesson Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please select a video class from the curriculum sidebar on the right to start learning.
              </p>
            </div>
          )}
        </main>

        {/* Right Drawer: Hierarchical Curriculum Tree (Milestones -> Modules -> 5-9 Videos) */}
        {sidebarOpen && (
          <aside className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FiLayers size={14} className="text-indigo-400" />
                  <span>Course Curriculum</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {curriculumData?.milestones?.length || 0} Milestones • {stats.total_lessons} Lessons
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Tree Accordion */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(curriculumData?.milestones || []).map((ms, msIdx) => {
                const isMsExpanded = !!expandedMilestones[ms.id];
                return (
                  <div
                    key={ms.id || msIdx}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xs"
                  >
                    {/* Milestone Header */}
                    <button
                      onClick={() => toggleMilestone(ms.id)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-black shrink-0 mt-0.5">
                          M{ms.milestone_no || msIdx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-black text-white leading-snug">
                            {ms.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {ms.completed_lessons}/{ms.total_lessons} Done
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400 shrink-0">
                        {isMsExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                      </span>
                    </button>

                    {/* Modules under this Milestone */}
                    {isMsExpanded && (
                      <div className="p-2 space-y-2 border-t border-slate-800/80 bg-slate-900/40">
                        {(ms.modules || []).map((mod, modIdx) => {
                          const isModExpanded = !!expandedModules[mod.id];
                          return (
                            <div
                              key={mod.id || modIdx}
                              className="rounded-xl border border-slate-800/60 bg-slate-900/90 overflow-hidden"
                            >
                              {/* Module Header */}
                              <button
                                onClick={() => toggleModule(mod.id)}
                                className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <FiBookOpen size={13} className="text-indigo-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-200 line-clamp-1">
                                    {mod.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold shrink-0">
                                  <span>{mod.lessons?.length || 0} Videos</span>
                                  {isModExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                </div>
                              </button>

                              {/* 5-9 Video Lessons List */}
                              {isModExpanded && (
                                <div className="divide-y divide-slate-800/50 bg-slate-950/70">
                                  {(mod.lessons || []).map((les) => {
                                    const isCurrent = activeLesson?.id === les.id;
                                    const isUnlocked = !!unlockedLessonIds[les.id];
                                    return (
                                      <div
                                        key={les.id}
                                        onClick={() => handleSelectLesson(les)}
                                        className={`p-2.5 pl-3 flex items-center justify-between gap-3 text-left transition-all group ${
                                          !isUnlocked
                                            ? 'opacity-40 cursor-not-allowed text-slate-500 hover:bg-transparent'
                                            : isCurrent
                                            ? 'bg-indigo-600/20 border-l-4 border-indigo-500 text-white cursor-pointer'
                                            : 'hover:bg-slate-800/50 text-slate-300 cursor-pointer'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {!isUnlocked ? (
                                            <FiLock size={14} className="text-slate-500 shrink-0" />
                                          ) : les.is_completed ? (
                                            <FiCheckCircle size={15} className="text-emerald-400 shrink-0" />
                                          ) : isCurrent ? (
                                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></div>
                                          ) : (
                                            <FiCircle size={14} className="text-slate-500 shrink-0 group-hover:text-slate-400" />
                                          )}
                                          <div className="min-w-0">
                                            <p className={`text-xs truncate ${!isUnlocked ? 'text-slate-500 font-medium' : isCurrent ? 'font-black text-indigo-300' : 'font-medium'}`}>
                                              {les.title}
                                            </p>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                                              <FiClock size={10} />
                                              <span>{les.duration_minutes}</span>
                                              {!isUnlocked && <span className="text-amber-500/80 ml-1">🔒 Locked</span>}
                                            </p>
                                          </div>
                                        </div>

                                        {isUnlocked && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleComplete(les, !les.is_completed);
                                            }}
                                            className={`p-1 rounded-lg transition-colors shrink-0 ${
                                              les.is_completed
                                                ? 'text-emerald-400 hover:bg-emerald-950/40'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                            }`}
                                            title={les.is_completed ? "Mark Incomplete" : "Mark Complete"}
                                          >
                                            <FiCheck size={13} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
