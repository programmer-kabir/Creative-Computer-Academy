import React from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

export const DeptFilterDropdown = ({ value, onChange, departments }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);
  const selectedName = value;

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getLabel = () => selectedName === 'all' ? 'All Depts' : selectedName;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`flex items-center gap-2.5 px-4 h-11 rounded-2xl border transition-all outline-none text-left bg-white dark:bg-slate-800 shadow-sm flex-shrink-0
          ${open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dept:</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getLabel()}</span>
        </div>
        <FiChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-[300] overflow-hidden">
          {/* Search inside filter */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-2.5 py-1.5 border border-transparent dark:border-slate-700/50">
              <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dept..."
                className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            <li>
              <button
                type="button"
                onClick={() => { onChange('all'); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200
                  ${selectedName === 'all' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}
              >
                All Depts
              </button>
            </li>
            <div className="h-px bg-slate-100 my-1" />
            {departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center font-medium">No dept found</li>
            ) : (
              departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => (
                <li key={d.id || d.name}>
                  <button
                    type="button"
                    onClick={() => { onChange(d.name); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200
                    ${selectedName === d.name ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    <span className="truncate flex-1">{d.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
