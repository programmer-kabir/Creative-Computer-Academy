import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiClock, FiCheckSquare, FiBookOpen,
  FiUser, FiLogOut, FiAward
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const StudentSidebar = ({ isOpen = true }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FiGrid size={18} /> },
    { name: 'Daily Attendance', path: '/attendance', icon: <FiClock size={18} /> },
    { name: 'Assignments & Projects', path: '/assignments', icon: <FiCheckSquare size={18} /> },
    { name: 'Course Resources', path: '/resources', icon: <FiBookOpen size={18} /> },
    { name: 'Student Profile & ID', path: '/profile', icon: <FiUser size={18} /> },
  ];

  return (
    <aside
      className={`h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-40 shrink-0 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 shrink-0">
            CCA
          </div>
          {isOpen && (
            <div className="overflow-hidden">
              <h1 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">
                Student Portal
              </h1>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                Creative Computer Academy
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${!isOpen && 'justify-center px-0'}`
              }
              title={!isOpen ? item.name : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {isOpen && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        {isOpen ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center shrink-0 text-sm">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Student'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {currentUser?.student_info?.student_code || currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default StudentSidebar;
