import React from 'react';

const TaskTabs = ({ columns, activeTab, onTabChange }) => {
  return (
    <div className="flex overflow-x-auto custom-scrollbar gap-4 mb-8 pb-4 pt-2 px-1">
      {Object.keys(columns).map(tab => {
        const count = columns[tab].length;
        const isActive = activeTab === tab;
        
        let tabStyle = 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md';
        let icon = null;
        
        if (isActive) {
          if (tab === 'Unassigned') { tabStyle = 'bg-indigo-500 dark:bg-indigo-600 text-white border-indigo-500 dark:border-indigo-600 shadow-lg shadow-indigo-500/30'; icon = <span className="w-2.5 h-2.5 rounded-full bg-indigo-200 shadow-[0_0_8px_rgba(199,210,254,0.8)] animate-pulse"></span>; }
          if (tab === 'To-Do') { tabStyle = 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700 shadow-lg shadow-slate-800/20'; icon = <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"></span>; }
          if (tab === 'In Progress') { tabStyle = 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700 shadow-lg shadow-blue-600/30'; icon = <span className="w-2.5 h-2.5 rounded-full bg-blue-200 shadow-[0_0_8px_rgba(191,219,254,0.8)] animate-pulse"></span>; }
          if (tab === 'In Review') { tabStyle = 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600 shadow-lg shadow-amber-500/30'; icon = <span className="w-2.5 h-2.5 rounded-full bg-amber-100 shadow-[0_0_8px_rgba(254,243,199,0.8)] animate-pulse"></span>; }
          if (tab === 'Rejected') { tabStyle = 'bg-red-600 dark:bg-red-700 text-white border-red-600 dark:border-red-700 shadow-lg shadow-red-600/30'; icon = <span className="w-2.5 h-2.5 rounded-full bg-red-200 shadow-[0_0_8px_rgba(254,202,202,0.8)] animate-pulse"></span>; }
          if (tab === 'Completed') { tabStyle = 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500 dark:border-emerald-600 shadow-lg shadow-emerald-500/30'; icon = <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 shadow-[0_0_8px_rgba(209,250,229,0.8)] animate-pulse"></span>; }
        } else {
           if (tab === 'Unassigned') icon = <span className="w-2.5 h-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50"></span>;
           if (tab === 'To-Do') icon = <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600"></span>;
           if (tab === 'In Progress') icon = <span className="w-2.5 h-2.5 rounded-full bg-blue-100 dark:bg-blue-900/50"></span>;
           if (tab === 'In Review') icon = <span className="w-2.5 h-2.5 rounded-full bg-amber-100 dark:bg-amber-900/50"></span>;
           if (tab === 'Rejected') icon = <span className="w-2.5 h-2.5 rounded-full bg-red-100 dark:bg-red-900/50"></span>;
           if (tab === 'Completed') icon = <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50"></span>;
        }
        
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex items-center gap-3 px-6 py-3 font-bold text-[13px] transition-all duration-300 border rounded-2xl whitespace-nowrap ${tabStyle} ${!isActive ? 'hover:-translate-y-1' : 'scale-105 transform origin-bottom'}`}
          >
            {icon}
            <span className="uppercase tracking-wider">{tab}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TaskTabs;
