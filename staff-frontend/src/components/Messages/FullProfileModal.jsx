import React from 'react';
import { FiX, FiMail, FiPhone, FiCalendar, FiShield, FiBriefcase, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FullProfileModal = ({
  viewingProfileCode,
  setViewingProfileCode,
  viewingProfileData,
  loadingProfile,
  API_URL,
}) => {
  if (!viewingProfileCode) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={() => setViewingProfileCode(null)} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiUser className="text-primary-500" /> Staff Profile
            </h3>
            <button
              onClick={() => setViewingProfileCode(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <FiX size={18} />
            </button>
          </div>

          {loadingProfile ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400">Loading Profile Details...</p>
            </div>
          ) : viewingProfileData ? (
            <div className="overflow-y-auto pt-4 space-y-5 flex-1 pr-1">
              {/* Profile Card Header */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-4 border-slate-100 dark:border-slate-700 shadow-md bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                  {viewingProfileData.profile_picture ? (
                    <img
                      src={`${API_URL}${viewingProfileData.profile_picture}`}
                      alt={viewingProfileData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    viewingProfileData.name?.charAt(0) || 'U'
                  )}
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{viewingProfileData.name}</h4>
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                  {viewingProfileData.role_display || viewingProfileData.role_name || 'Staff Member'}
                </p>
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  ID: {viewingProfileData.employee_code || viewingProfileCode}
                </span>
              </div>

              {/* Info Grid */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <FiMail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{viewingProfileData.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FiPhone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{viewingProfileData.phone || 'N/A'}</p>
                  </div>
                </div>

                {viewingProfileData.department && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <FiBriefcase size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{viewingProfileData.department}</p>
                    </div>
                  </div>
                )}

                {viewingProfileData.join_date && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                      <FiCalendar size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{viewingProfileData.join_date}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <FiShield size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {viewingProfileData.status || 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-slate-400">Profile data not available.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FullProfileModal;
