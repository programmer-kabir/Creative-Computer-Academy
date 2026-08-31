import React from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

const DEPT_COLORS = [
    { icon: '🎨', color: 'from-pink-500 to-rose-500' },
    { icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { icon: '📢', color: 'from-orange-500 to-amber-500' },
    { icon: '🎬', color: 'from-purple-500 to-violet-500' },
    { icon: '📋', color: 'from-slate-500 to-slate-600' },
    { icon: '🚀', color: 'from-emerald-500 to-teal-500' },
    { icon: '🎯', color: 'from-red-500 to-orange-500' },
    { icon: '⚡', color: 'from-yellow-500 to-amber-500' },
    { icon: '✨', color: 'from-indigo-500 to-blue-600' },
    { icon: '🖌️', color: 'from-teal-500 to-emerald-500' },
];

const DEFAULT_CATEGORIES = [
    { id: 'graphic-design', name: 'Graphic Design' },
    { id: 'web-development', name: 'Web Development' },
    { id: 'ui-ux-design', name: 'UI/UX Design' },
    { id: 'video-editing', name: 'Video Editing' },
    { id: 'digital-marketing', name: 'Digital Marketing' },
    { id: 'content-writing', name: 'Content Writing' },
    { id: '3d-motion', name: '3D & Motion Graphics' },
    { id: 'seo-smm', name: 'SEO & Social Media' },
    { id: 'app-development', name: 'App Development' },
];

export const CategorySelect = ({ value, onChange, departments = [] }) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef(null);

    React.useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Combine DB departments with default presets (no duplicates)
    const allCategories = React.useMemo(() => {
        const list = Array.isArray(departments) && departments.length > 0 ? [...departments] : [];
        const existingNames = new Set(list.map(d => (d.name || '').toLowerCase()));
        
        DEFAULT_CATEGORIES.forEach(cat => {
            if (!existingNames.has(cat.name.toLowerCase())) {
                list.push(cat);
            }
        });
        return list;
    }, [departments]);

    const filtered = allCategories.filter(d =>
        (d.name || '').toLowerCase().includes(search.toLowerCase())
    );

    // Get color/icon for a dept name by its index in the list
    const getMeta = (name, idx) => DEPT_COLORS[idx % DEPT_COLORS.length];
    const selectedIdx = allCategories.findIndex(d => d.name === value);
    const meta = selectedIdx >= 0 ? getMeta(value, selectedIdx) : DEPT_COLORS[0];

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setSearch(''); }}
                className={`w-full h-[42px] flex items-center gap-2.5 px-3 rounded-xl border transition-all outline-none text-left
          ${open ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'}`}
            >
                {value ? (
                    <>
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center text-xs flex-shrink-0 text-white shadow-sm`}>
                            {meta.icon}
                        </div>
                        <span className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{value}</span>
                    </>
                ) : (
                    <span className="flex-1 text-xs text-slate-400 font-medium">Select Category</span>
                )}
                <FiChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[999] overflow-hidden py-1.5">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                            <FiSearch size={13} className="text-slate-400 flex-shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search category..."
                                className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-slate-400 text-center">No categories found</p>
                        ) : (
                            filtered.map((dept, idx) => {
                                const m = getMeta(dept.name, idx);
                                return (
                                    <button
                                        key={dept.id || idx}
                                        type="button"
                                        onClick={() => { onChange(dept.name); setOpen(false); }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20
                    ${value === dept.name ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center text-xs flex-shrink-0 text-white shadow-sm`}>
                                            {m.icon}
                                        </div>
                                        <span className="flex-1 text-xs text-slate-800 dark:text-slate-100">{dept.name}</span>
                                        {value === dept.name && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
