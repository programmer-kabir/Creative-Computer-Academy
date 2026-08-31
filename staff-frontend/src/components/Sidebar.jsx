import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiClock, FiList, FiCalendar, FiUser, FiLogOut, FiFileText, FiMessageSquare, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    let isMounted = true;
    const abortController = new AbortController();

    const fetchUnreadCount = async () => {
      try {
        const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/chat/get_chats.php', {
          user_id: currentUser.id
        }, {
          signal: abortController.signal
        });
        if (isMounted && res.data.status === 'success') {
          const count = res.data.chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching unread count', error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      abortController.abort();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', transKey: 'dashboard', path: '/', icon: <FiHome size={20} /> },
    { name: 'Message', transKey: 'message', path: '/messages', icon: <FiMessageSquare size={20} /> },
    { name: 'Attendance', transKey: 'attendance', path: '/attendance', icon: <FiClock size={20} /> },
    { name: 'Tasks', transKey: 'tasks', path: '/tasks', icon: <FiList size={20} /> },
    { name: 'Leave', transKey: 'leave', path: '/leave', icon: <FiCalendar size={20} /> },
    { name: 'Reports', transKey: 'reports', path: '/reports', icon: <FiFileText size={20} /> },
    { name: 'Profile', transKey: 'profile', path: '/profile', icon: <FiUser size={20} /> },
    { name: 'Settings', transKey: 'settings', path: '/settings', icon: <FiSettings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 h-screen flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 z-50">
      {/* Logo/Brand Area */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <img src="/cca_logo.png" alt="CCA Logo" className="w-8 h-8 rounded-lg object-contain drop-shadow-xs shrink-0" />
        <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-wide">CCA<span className="text-primary-600 dark:text-primary-400 drop-shadow-sm">Staff</span></h1>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ease-out overflow-hidden ${
                  isActive
                    ? 'bg-primary-50/80 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]'
                    : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Subtle active state glow background */}
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent dark:from-primary-400/10 dark:via-primary-400/5 opacity-70 pointer-events-none"></div>}
                  
                  {/* Active indicator bar with glowing shadow */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-gradient-to-b from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out ${isActive ? 'h-4/5 opacity-100' : 'h-0 opacity-0 group-hover:h-1/2 group-hover:opacity-40'}`}></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-3 group-active:scale-95 ${isActive ? 'drop-shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
                      {item.icon}
                    </div>
                    <span className="font-bold tracking-wide">{t(item.transKey)}</span>
                  </div>
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <span className="relative z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse group-hover:scale-110 transition-transform">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Info / Logout Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-600/30 flex items-center justify-center text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50 font-black uppercase shadow-sm overflow-hidden shrink-0">
            {currentUser?.profile_picture ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL}${currentUser.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                currentUser?.name ? currentUser.name.charAt(0) : 'U'
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser?.name || 'Staff Member'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate mt-0.5">{currentUser?.employee_code || 'Pending ID'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 shadow-sm transition-all duration-300 font-bold text-sm uppercase tracking-wider"
        >
          <FiLogOut size={16} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
