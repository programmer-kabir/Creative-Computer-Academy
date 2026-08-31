import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiCheckSquare, FiClock, FiCalendar, FiSettings, FiLogOut, FiBarChart2, FiMessageSquare, FiDatabase } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminSidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    const fetchCounts = async () => {
      try {
        const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/chat/get_chats.php', {
          user_id: currentUser.id
        });
        if (res.data.status === 'success') {
          const count = res.data.chats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error fetching unread count', error);
      }
      
      try {
        const res = await axios.get((import.meta.env.VITE_API_BASE_URL) + 'api/admin/attendance/get_pending_disputes_count.php');
        if (res.data.status === 'success') {
          setPendingDisputes(res.data.count);
        }
      } catch (error) {
        console.error('Error fetching disputes count', error);
      }
    };

    if (currentUser?.id) {
      fetchCounts();
      const interval = setInterval(() => {
        if (!document.hidden) fetchCounts();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const menuItems = [
    { name: 'Dashboard',       path: '/',           icon: <FiGrid size={20} /> },
    { name: 'Staff Directory', path: '/staff',       icon: <FiUsers size={20} /> },
    { name: 'Task Oversight',  path: '/tasks',       icon: <FiCheckSquare size={20} /> },
    { 
      name: 'Work & Attendance', 
      icon: <FiClock size={20} />,
      badge: pendingDisputes,
      subItems: [
        { name: 'Daily Roster', path: '/attendance' },
        { name: 'Leave Approvals', path: '/leave' },
        { name: 'Attendance Disputes', path: '/attendance-disputes', badge: pendingDisputes }
      ]
    },
    { 
      name: 'Reports & Analytics', 
      icon: <FiBarChart2 size={20} />,
      subItems: [
        { name: 'Company Master Report', path: '/master-report' },
        { name: 'Staff Reports', path: '/reports' },
        { name: 'Reviewer Reports', path: '/reviewer-report' }
      ]
    },
    { name: 'Message',         path: '/messages',     icon: <FiMessageSquare size={20} /> },
    { name: 'Database Manager', path: '/database',    icon: <FiDatabase size={20} /> },
    { name: 'Settings',        path: '/settings',    icon: <FiSettings size={20} /> },
  ];

  return (
    <div className="w-72 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 h-screen flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 z-[100] transition-colors">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
          CCA<span className="text-blue-600 dark:text-blue-500">Admin</span>
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            if (item.subItems) {
              const isOpen = openMenus[item.name];
              const isAnyChildActive = item.subItems.some(sub => window.location.pathname + window.location.search === sub.path);
              
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      isAnyChildActive || isOpen
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isAnyChildActive ? 'text-blue-400' : ''}>{item.icon}</span>
                      <span className={`font-semibold text-sm tracking-wide ${isAnyChildActive ? 'text-blue-400' : ''}`}>{item.name}</span>
                      {item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isOpen && (
                    <div className="pl-11 pr-2 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                      {item.subItems.map(sub => {
                        const isSubActive = window.location.pathname + window.location.search === sub.path;
                        return (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSubActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className="flex-1">{sub.name}</span>
                            {sub.badge > 0 && (
                              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-2">
                                {sub.badge}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                </div>
                {item.name === 'Message' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0">
            {currentUser?.profile_picture ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${currentUser.profile_picture}`}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email || 'admin@cca.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 py-2.5 rounded-xl transition-all text-sm font-semibold"
        >
          <FiLogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
