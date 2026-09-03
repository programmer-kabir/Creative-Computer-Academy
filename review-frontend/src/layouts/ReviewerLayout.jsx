import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import {
  FiHome, FiUsers, FiAward, FiLogOut, FiMenu, FiX, FiShield, FiClock, FiUser, FiSettings, FiCheckCircle, FiPieChart, FiAlertOctagon, FiSidebar, FiLayers
} from 'react-icons/fi';
import { Toaster, toast } from 'sonner';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const navItems = [
  { to: '/',                 icon: FiHome,          label: 'Dashboard' },
  { to: '/brand-resources',  icon: FiLayers,        label: 'Brand Resources' },
  { to: '/pending',          icon: FiClock,         label: 'Pending Reviews' },
  { to: '/completed',        icon: FiCheckCircle,   label: 'Completed Reviews' },
  { to: '/rejected',         icon: FiAlertOctagon,  label: 'Rejected' },
  { to: '/reports',          icon: FiPieChart,      label: 'Reports' },
  { to: '/team',             icon: FiUsers,         label: 'My Team' },
  { to: '/leaderboard',      icon: FiAward,         label: 'Leaderboard' },
  { to: '/profile',          icon: FiUser,          label: 'Profile' },
  { to: '/settings',         icon: FiSettings,      label: 'Settings' },
];

const ReviewerLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar toggle state (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('cca_reviewer_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cca_reviewer_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;

    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);

    channel.bind('new-notification', function (data) {
      toast.info(data.title, {
        description: data.message,
      });
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const avatar = currentUser?.profile_picture
    ? `${API_BASE}${currentUser.profile_picture}`
    : null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="CCA Logo" className="w-9 h-9 object-contain shrink-0" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">CCA Review</p>
            <p className="text-white/40 text-xs font-medium">Work Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isRejected = to === '/rejected';
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform group ${isActive
                  ? isRejected
                    ? 'bg-red-600/20 text-red-500 font-semibold border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'bg-brand-600/20 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(var(--brand-500-rgb),0.15)]'
                  : isRejected
                    ? 'text-red-500 font-semibold hover:text-red-400 hover:bg-red-500/10 hover:translate-x-1'
                    : 'text-white/50 hover:text-white hover:bg-white/5 hover:translate-x-1'
                }`
              }
            >
              <span className="transition-transform duration-300 group-hover:scale-110"><Icon size={17} /></span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-5 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          {avatar
            ? <img src={avatar} className="w-9 h-9 rounded-full object-cover border border-brand-500/30" alt="" />
            : <div className="w-9 h-9 rounded-full bg-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-sm">
              {currentUser?.name?.[0] || 'R'}
            </div>
          }
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{currentUser?.name}</p>
            <p className="text-white/40 text-[10px] truncate mt-0.5">{currentUser?.designation || 'Reviewer'}</p>
            {(currentUser?.employee_code || currentUser?.reviewer_code) && (
              <p className="text-brand-400 text-[10px] font-mono mt-0.5 leading-none">
                {currentUser.employee_code || currentUser.reviewer_code}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/15 hover:text-red-400 transition-all cursor-pointer"
        >
          <FiLogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden font-sans">
      <Toaster richColors position="top-right" />

      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-dark-900/40 backdrop-blur-3xl border-r border-white/5 fixed inset-y-0 left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-60 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full pointer-events-none'
        }`}
      >
        <div className="w-60 h-full flex flex-col shrink-0">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 bg-dark-900 border-r border-white/5">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 relative z-10 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:pl-60' : 'lg:pl-0'
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 bg-dark-900/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(prev => !prev);
                } else {
                  toggleSidebar();
                }
              }}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 group ${
                isSidebarOpen
                  ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                  : 'bg-brand-600/20 text-brand-400 border-brand-500/30 hover:bg-brand-600/30 ring-2 ring-brand-500/20'
              }`}
              title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
              aria-label="Toggle Sidebar"
            >
              <FiSidebar
                size={18}
                className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180 text-brand-400' : 'text-white/70 group-hover:text-white'}`}
              />
            </button>
            <span className="text-white font-bold text-sm tracking-wide">CCA Review Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell portal="reviewer" />
          </div>
        </div>
        <main className="p-4 lg:p-6 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ReviewerLayout;
