import React, { useState } from 'react';
import StudentSidebar from '../components/StudentSidebar';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'sonner';
import { FiSidebar } from 'react-icons/fi';

const StudentLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#090d16] overflow-hidden transition-colors">
      <Toaster position="top-right" richColors />
      <StudentSidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header Bar */}
        <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <FiSidebar size={18} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Welcome back, {currentUser?.name || 'Student'}! 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full border border-indigo-200 dark:border-indigo-800">
                {currentUser?.student_info?.batch_no || 'Batch-01'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
