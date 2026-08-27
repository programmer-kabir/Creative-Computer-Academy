import { FiCheckCircle, FiXCircle, FiClock, FiTarget } from 'react-icons/fi';

export const StatsGrid = ({ stats }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <FiTarget size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Assigned</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <FiClock size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">To-Do</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todo}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FiCheckCircle size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.completed}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <FiXCircle size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.rejected}</p>
            </div>
        </div>
    </div>
);
