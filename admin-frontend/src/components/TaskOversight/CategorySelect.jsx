import React from 'react';
import { FiChevronDown } from 'react-icons/fi';
const DEPT_COLORS = [
    { icon: '🎨', color: 'from-pink-500 to-rose-500' },
    { icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { icon: '📢', color: 'from-orange-500 to-amber-500' },
    { icon: '🎬', color: 'from-purple-500 to-violet-500' },
    { icon: '📋', color: 'from-slate-500 to-slate-600' },
    { icon: '🚀', color: 'from-emerald-500 to-teal-500' },
    { icon: '🎯', color: 'from-red-500 to-orange-500' },
    { icon: '⚡', color: 'from-yellow-500 to-amber-500' },
];

export const CategorySelect = ({ value, onChange, departments }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);

    React.useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Get color/icon for a dept name by its index in the list
    const getMeta = (name, idx) => DEPT_COLORS[idx % DEPT_COLORS.length];
    const selectedIdx = departments.findIndex(d => d.name === value);
    const meta = selectedIdx >= 0 ? getMeta(value, selectedIdx) : DEPT_COLORS[4];

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all outline-none text-left
          ${open ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'}`}
            >
                {value ? (
                    <>
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-sm flex-shrink-0`}>
                            {meta.icon}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</span>
                    </>
                ) : (
                    <span className="flex-1 text-sm text-slate-400 font-medium">Select Category</span>
                )}
                <FiChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-[300] overflow-hidden py-1.5">
                    {departments.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-400 text-center">Loading departments...</p>
                    ) : (
                        departments.map((dept, idx) => {
                            const m = getMeta(dept.name, idx);
                            return (
                                <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() => { onChange(dept.name); setOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20
                    ${value === dept.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center text-sm flex-shrink-0`}>
                                        {m.icon}
                                    </div>
                                    <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{dept.name}</span>
                                    {value === dept.name && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};
