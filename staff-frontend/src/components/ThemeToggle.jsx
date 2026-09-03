import React, { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cca_theme') || localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cca_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cca_theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(prev => !prev)}
      className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 shadow-xs cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <FiSun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
      ) : (
        <FiMoon className="w-4 h-4 text-blue-500 animate-in spin-in-180 duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
