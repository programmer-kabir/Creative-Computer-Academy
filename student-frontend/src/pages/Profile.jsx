import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiUser, FiMail, FiPhone, FiBookOpen,
  FiCalendar, FiAward, FiLock, FiCheckCircle, FiShield,
  FiLayers, FiCheck
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const { currentUser, updateUser } = useAuth();
  const { activeCourse, courses, selectCourse } = useCourse();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      setChangingPass(true);
      const res = await axios.post(`${API_BASE}api/profile/change_password.php`, {
        user_id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword
      });

      if (res.data.status === 'success') {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data.message || 'Failed to update password.');
      }
    } catch (err) {
      toast.error('Error changing password.');
    } finally {
      setChangingPass(false);
    }
  };

  const currentCourseName = activeCourse?.course_title || currentUser?.student_info?.course_name || 'Enrolled Course';
  const currentStudentCode = activeCourse?.student_code || currentUser?.student_info?.student_code || 'STU-1001';

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl">
            <FiUser size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Student Profile & Digital ID</h1>
            <p className="text-xs sm:text-sm text-slate-400">View your academy credentials, enrollment card, and account settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Student ID Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl shadow-2xl p-6 relative overflow-hidden border border-indigo-500/20 flex flex-col justify-between min-h-[400px]">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/5 blur-2xl"></div>
            
            {/* Top Bar */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">CCA</div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-indigo-200">Creative Computer Academy</p>
                  <p className="text-[9px] text-white/60 font-medium">OFFICIAL STUDENT ID CARD</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            {/* Middle: Avatar & Info */}
            <div className="relative z-10 my-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-white/10 border-2 border-white/20 mx-auto flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-black/20">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <h3 className="text-lg font-black mt-3 tracking-tight">{currentUser?.name || 'Student Name'}</h3>
              <p className="text-xs font-bold text-indigo-200 mt-0.5">{currentCourseName}</p>
            </div>

            {/* Bottom: ID Details */}
            <div className="relative z-10 space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase">Student ID</p>
                  <p className="font-mono font-bold text-amber-300">{currentStudentCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase">Status</p>
                  <p className="font-bold text-emerald-400">Enrolled</p>
                </div>
              </div>

              {/* Barcode */}
              <div className="w-full h-8 bg-white/10 rounded-lg flex items-center justify-around px-2 opacity-70">
                <div className="w-1 h-5 bg-white"></div>
                <div className="w-2 h-5 bg-white"></div>
                <div className="w-0.5 h-5 bg-white"></div>
                <div className="w-1.5 h-5 bg-white"></div>
                <div className="w-0.5 h-5 bg-white"></div>
                <div className="w-2 h-5 bg-white"></div>
                <div className="w-1 h-5 bg-white"></div>
                <div className="w-0.5 h-5 bg-white"></div>
                <div className="w-2 h-5 bg-white"></div>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Switcher if > 1 */}
          {courses && courses.length > 1 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FiLayers className="text-indigo-600" />
                  <span>Enrolled Courses ({courses.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to switch</span>
              </div>

              <div className="space-y-2">
                {courses.map((c) => {
                  const isSel = activeCourse?.course_id === c.course_id;
                  return (
                    <button
                      key={c.course_id}
                      onClick={() => {
                        selectCourse(c);
                        toast.success(`Active card switched to ${c.course_title}`);
                      }}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.course_title}
                        </p>
                        <p className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {c.course_code} • {c.student_code}
                        </p>
                      </div>
                      {isSel && <FiCheck className="text-indigo-600 dark:text-indigo-400 shrink-0" size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile Info & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Information Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <FiUser size={18} className="text-indigo-600" />
              <span>Enrollment & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentUser?.name}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentUser?.email}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Course</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentCourseName}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student ID</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentStudentCode}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Phone</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{currentUser?.phone || 'Not Provided'}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guardian Phone</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{activeCourse?.guardian_phone || currentUser?.student_info?.guardian_phone || 'Not Provided'}</p>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <FiShield size={18} className="text-indigo-600" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <FiLock size={14} />
                  <span>{changingPass ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
