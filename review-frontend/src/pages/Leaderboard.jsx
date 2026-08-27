import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiCheckCircle, FiXCircle, FiChevronRight, FiRefreshCw } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Score: completion × 0.70 - rejection_penalty (max 30)
const calcScore = (completed, total, rejected) => {
  if (total === 0) return 0;
  const rate     = Math.round((completed / total) * 100);
  const penalty  = Math.min(30, Math.round((rejected / total) * 30));
  return Math.max(0, Math.min(100, Math.round(rate * 0.70 - penalty)));
};

const scoreColor = (s) =>
  s >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
  : s >= 60 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
  : s >= 40 ? 'text-orange-400 bg-orange-500/10 border-orange-500/25'
  :           'text-red-400 bg-red-500/10 border-red-500/25';

const rankEmoji = (i) =>
  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam]     = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  const today      = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const todayStr   = today.toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      try {
        const teamRes = await axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${currentUser.id}`);
        if (teamRes.data.status !== 'success') return;
        const members = teamRes.data.data || [];
        setTeam(members);

        const scoreMap = {};
        await Promise.all(members.map(async (m) => {
          try {
            const res = await axios.post(`${API_BASE}api/reports/get_task_report.php`, {
              user_id: m.user_id, start_date: monthStart, end_date: todayStr
            });
            const s = res.data?.summary;
            if (s) {
              const score = calcScore(s.total_completed, s.total_assigned, s.total_rejected);
              const rate  = s.total_assigned > 0 ? Math.round((s.total_completed / s.total_assigned) * 100) : 0;
              scoreMap[m.user_id] = {
                score,
                rate,
                completed:   s.total_completed,
                total:       s.total_assigned,
                rejected:    s.total_rejected,
                resubmitted: s.total_resubmitted,
                delayed:     s.delayed_completions,
              };
            }
          } catch { /* skip */ }
        }));
        setScores(scoreMap);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const ranked = useMemo(() =>
    [...team].sort((a, b) => (scores[b.user_id]?.score ?? -1) - (scores[a.user_id]?.score ?? -1)),
    [team, scores]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className=" mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiAward className="text-yellow-400" /> Work Leaderboard
        </h1>
        <p className="text-white/40 text-sm mt-1">
          This month's ranking by task performance
          <span className="ml-2 text-white/25 text-xs">(Score = Completion × 70% − Rejection penalty)</span>
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5 text-white/30">
          No team members assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((m, i) => {
            const s  = scores[m.user_id];
            const sc = s ? scoreColor(s.score) : 'text-white/30 bg-white/5 border-white/10';
            return (
              <button
                key={m.user_id}
                onClick={() => navigate(`/review/${m.user_id}`)}
                className="w-full glass-hover rounded-2xl p-4 border border-white/5 flex items-center gap-4 group text-left"
              >
                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {rankEmoji(i)
                    ? <span className="text-2xl">{rankEmoji(i)}</span>
                    : <span className="text-white/25 font-bold text-base">#{i + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                  {m.profile_picture
                    ? <img src={`${API_BASE}${m.profile_picture}`} className="w-full h-full object-cover" alt={m.name} />
                    : <span className="w-full h-full flex items-center justify-center font-bold text-brand-400 text-lg">{m.name?.[0]}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-semibold text-sm group-hover:text-brand-400 transition-colors truncate">{m.name}</p>
                  <p className="text-white/40 text-xs truncate">{m.designation || m.department_name || '—'}</p>
                  {s && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-white/35">
                      <span className="flex items-center gap-1"><FiCheckCircle size={11} className="text-emerald-400" />{s.completed}/{s.total} done</span>
                      <span className="flex items-center gap-1"><FiXCircle     size={11} className="text-red-400"     />{s.rejected} rejected</span>
                      {s.resubmitted > 0 && <span className="flex items-center gap-1"><FiRefreshCw size={11} className="text-yellow-400" />{s.resubmitted} resubmit</span>}
                    </div>
                  )}
                </div>

                {/* Completion bar + Score */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  {s && (
                    <div className="w-24 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-white/30 mb-1">
                        <span>done</span><span>{s.rate}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${s.rate}%` }} />
                      </div>
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center ${sc}`}>
                    <span className="text-lg font-black leading-none">{s?.score ?? '—'}</span>
                    <span className="text-[10px] opacity-50">/100</span>
                  </div>
                </div>

                <FiChevronRight size={16} className="text-white/15 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
