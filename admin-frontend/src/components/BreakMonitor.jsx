import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCoffee, FiSquare, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const BreakMonitor = () => {
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState(new Date().getTime());
  const [now, setNow] = useState(new Date().getTime());

  const fetchLiveBreaks = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/get_live_breaks.php');
      if (res.data.status === 'success') {
        setBreaks(res.data.data);
        setServerTime(new Date(res.data.server_time).getTime());
        setNow(new Date(res.data.server_time).getTime());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBreaks();
    const intervalId = setInterval(fetchLiveBreaks, 30000); // Refresh every 30s
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => {
      setNow(prev => prev + 1000);
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  const handleForceEnd = async (breakId) => {
    if (!window.confirm("Are you sure you want to force end this break?")) return;
    try {
      const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/end_break.php', {
        break_id: breakId
      });
      if (res.data.status === 'success') {
        fetchLiveBreaks();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error ending break.');
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <FiCoffee size={16} />
          </span>
          Live Break Monitor
        </h3>
        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
          {breaks.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[250px]">
        {breaks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FiCheckCircle size={40} className="mb-2 text-slate-300" />
            <p className="font-medium text-sm">No one is currently on break.</p>
          </div>
        ) : (
          breaks.map((b) => {
            const startTime = new Date(b.start_time).getTime();
            const diff = Math.max(0, Math.floor((now - startTime) / 1000));
            const elapsedMinutes = Math.floor(diff / 60);
            const limit = parseInt(b.allocated_break_minutes) || 60;
            const isOvertime = elapsedMinutes >= limit;
            
            const m = String(elapsedMinutes).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');

            return (
              <div key={b.break_id} className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${isOvertime ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                    {b.profile_picture ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL}${b.profile_picture}`} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold uppercase">
                        {b.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{b.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">{b.break_type} • Limit: {limit}m</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`font-mono text-lg font-black ${isOvertime ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m}:{s}
                    {isOvertime && <FiAlertCircle className="inline ml-1 mb-1" size={14} />}
                  </div>
                  <button 
                    onClick={() => handleForceEnd(b.break_id)}
                    title="Force End Break"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <FiSquare size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BreakMonitor;
