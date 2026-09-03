import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import HeaderClock from '../components/HeaderClock';
import HeaderShiftStatus from '../components/HeaderShiftStatus';
import HeaderProfileDropdown from '../components/HeaderProfileDropdown';
import CommandPalette from '../components/CommandPalette';
import { Toaster, toast } from 'sonner';
import Pusher from 'pusher-js';
import { FiSearch, FiX, FiSidebar } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const AuthenticatedLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const isMessagesPage = location.pathname === '/messages';
  const isBrandKitPage = location.pathname === '/brand-kit';
  const searchInputRef = useRef(null);

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Sidebar toggle state (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    try {
      const saved = localStorage.getItem('cca_staff_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cca_staff_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcuts:
  // Ctrl+K -> Toggle Command Palette
  // Ctrl+B -> Toggle Sidebar
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSearchPlaceholder = () => {
    switch (location.pathname) {
      case '/tasks':
      case '/':
        return 'Search tasks (title, category, niche, notes)...';
      case '/attendance':
        return 'Search attendance records...';
      case '/leave':
        return 'Search leave requests...';
      case '/reports':
        return 'Search reports & logs...';
      case '/messages':
        return 'Search chats & messages...';
      default:
        return 'Search in this page...';
    }
  };
  
  React.useEffect(() => {
    if (!currentUser) return;
    
    // ⚠️ TODO: Replace with your actual Pusher Key ⚠️
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);
    
    channel.bind('new-notification', function(data) {
      toast.info(data.title, {
        description: data.message,
      });
      // Dispatch custom event so NotificationBell can reload if needed
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Toaster richColors position="top-right" />
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 px-6 shadow-xs relative z-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            {/* Sidebar Toggle Button (Close / Open) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 group ${
                isSidebarOpen
                  ? 'bg-slate-100/80 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 ring-2 ring-blue-500/15'
              }`}
              title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
              aria-label="Toggle Sidebar"
            >
              <FiSidebar
                size={18}
                className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}
              />
            </button>

            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              Welcome back, <span className="text-blue-600 dark:text-blue-400">{currentUser?.name || 'Staff'}</span>!
            </h2>
          </div>

          {/* Global Context-Aware Page Search Bar */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4">
            <div className="relative group w-full">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none"
                size={16}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-full pl-10 pr-20 py-2 h-10 bg-slate-100/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-full text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    title="Clear search"
                  >
                    <FiX size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs cursor-pointer transition-colors"
                    title="Open Command Palette (Ctrl+K)"
                  >
                    <span>Ctrl</span>
                    <span>K</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Shift & Punch-in Status Badge */}
            <HeaderShiftStatus />

            {/* Live CCA Official Server Clock */}
            <HeaderClock />

            {/* CCA Brand Kit Page Quick Launcher */}
            <button
              type="button"
              onClick={() => navigate('/brand-kit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs hover:shadow-sm active:scale-95 cursor-pointer ${
                isBrandKitPage
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-cyan-500/20 border border-blue-200/80 dark:border-blue-500/30 text-blue-700 dark:text-cyan-300'
              }`}
              title="CCA Official Brand Kit & Resource Hub"
            >
              <HiSparkles size={14} className={isBrandKitPage ? 'text-amber-300' : 'text-amber-500 animate-pulse'} />
              <span className="hidden sm:inline">Brand Kit</span>
            </button>

            {/* Dark/Light Theme Switcher */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell portal="staff" />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

            {/* Staff Profile Quick Dropdown */}
            <HeaderProfileDropdown />
          </div>
        </header>

        {/* Global Spotlight / Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onToggleSidebar={toggleSidebar}
        />

        <main className={`flex-1 flex flex-col min-h-0 ${isMessagesPage ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto'}`}>
          <div className={`mx-auto w-full ${isMessagesPage ? 'h-full flex-1 flex flex-col min-h-0' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
