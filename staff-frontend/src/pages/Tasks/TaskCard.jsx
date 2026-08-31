import React from 'react';
import { FiCode, FiFlag, FiPlayCircle, FiCheckSquare, FiPauseCircle, FiImage, FiStar } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  text = text.replace(/&nbsp;/g, ' ');
  return text;
};

const TaskCard = ({ task, onSelect, onStart, onClaim, onToggleTimer, formatTimeSpent }) => {
  const isDelayed = task.is_delayed;
  
  // Dynamic styling based on status
  let borderClass = 'border-slate-100 hover:shadow-slate-500/10 dark:border-slate-700';
  let gradientClass = 'from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-700';
  
  if (isDelayed && task.status === 'To-Do') {
    borderClass = 'border-red-200 hover:shadow-red-500/10 dark:border-red-900/50';
    gradientClass = 'from-red-400 to-red-600';
  } else if (task.status === 'In Progress') {
    borderClass = 'border-blue-50 hover:border-blue-200 hover:shadow-blue-500/20 dark:border-blue-900/50';
    gradientClass = 'from-blue-400 to-indigo-600';
  } else if (task.status === 'In Review') {
    borderClass = 'border-amber-50 hover:border-amber-200 hover:shadow-amber-500/20 dark:border-amber-900/50';
    gradientClass = 'from-amber-400 to-orange-500';
  } else if (task.status === 'Rejected') {
    borderClass = 'border-red-50 hover:border-red-200 hover:shadow-red-500/20 dark:border-red-900/50';
    gradientClass = 'from-red-400 to-rose-600';
  } else if (task.status === 'Completed') {
    borderClass = 'border-emerald-50 hover:border-emerald-200 hover:shadow-emerald-500/20 dark:border-emerald-900/50';
    gradientClass = 'from-emerald-400 to-teal-500';
  } else if (task.status === 'Unassigned') {
    borderClass = 'border-indigo-50 border-dashed hover:border-indigo-300 hover:shadow-indigo-500/20 dark:border-indigo-900/50';
    gradientClass = 'from-indigo-400 to-indigo-600';
  }

  const getCoverImage = () => {
    if (!task.visual_image) return '/no-image-placeholder.jpg';
    
    let images = [];
    try {
      if (task.visual_image.trim().startsWith('[')) {
        images = JSON.parse(task.visual_image);
      } else if (task.visual_image.includes(',')) {
        images = task.visual_image.split(',').map(i => i.trim());
      } else {
        images = [task.visual_image.trim()];
      }
    } catch (e) {
      images = [task.visual_image.trim()];
    }
    
    if (images.length > 0 && images[0]) {
      return `${import.meta.env.VITE_API_BASE_URL}${images[0]}`;
    }
    
    return '/no-image-placeholder.jpg';
  };

  const coverImageUrl = getCoverImage();

  return (
    <div 
      onClick={() => onSelect(task)} 
      className={`cursor-pointer group bg-white dark:bg-slate-800 rounded-[16px] shadow-sm hover:shadow-xl border ${borderClass} hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[320px]`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${gradientClass} z-10`}></div>
      
      {/* Cover Image Area */}
      <div className="w-full h-44 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 relative overflow-hidden flex items-center justify-center shrink-0">
        <img 
          src={coverImageUrl} 
          alt={task.title} 
          className={`w-full h-full ${coverImageUrl === '/no-image-placeholder.jpg' ? 'object-cover' : 'object-contain'} group-hover:scale-[1.03] transition-transform duration-500 ease-out`}
          onError={(e) => { 
            e.target.src = '/no-image-placeholder.jpg'; 
            e.target.className = 'w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out';
          }}
        />
        
        {/* Very subtle inner shadow/border overlay to make it pop */}
        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] pointer-events-none"></div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
            task.status === 'In Progress' ? 'text-blue-700 bg-blue-50/80 dark:bg-blue-900/50 dark:text-blue-300' :
            task.status === 'In Review' ? 'text-amber-700 bg-amber-50/80 dark:bg-amber-900/50 dark:text-amber-300' :
            task.status === 'Rejected' ? 'text-red-700 bg-red-50/80 dark:bg-red-900/50 dark:text-red-300' :
            task.status === 'Completed' ? 'text-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/50 dark:text-emerald-300' :
            'text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-700/80'
          }`}>{task.category}</span>

          {(Number(task.is_self_created) === 1 || task.is_self_created === true) && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
              <HiSparkles size={11} className="text-amber-500" /> Self Task
            </span>
          )}

          {(task.creation_mode === 'agentic' || Boolean(task.blueprint_data) || (Array.isArray(task.blueprint_variants) && task.blueprint_variants.length > 0)) && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <HiSparkles size={11} className="text-amber-400" /> AI Blueprint
            </span>
          )}

          {task.final_delivery && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <HiSparkles size={11} className="text-amber-500" /> Stock-Ready
            </span>
          )}
          
          {task.priority && (
            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
              task.priority === 'High' ? 'text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/50' : 
              task.priority === 'Medium' ? 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50' : 
              'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50'
            }`}>
              <FiFlag size={10} /> {task.priority}
            </span>
          )}
        </div>
        {isDelayed && task.status === 'To-Do' && <span className="inline-block text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 px-2 py-1 rounded-md animate-pulse">Delayed</span>}
      </div>
      
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug transition-colors line-clamp-2">{task.title}</h4>
      
      {task.status === 'Rejected' ? (
        <div className="mt-2 p-2.5 bg-red-50/50 dark:bg-red-900/20 border border-red-100/50 dark:border-red-900/50 rounded-xl mb-auto">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-800/70 dark:text-red-400/70 mb-1">Feedback</p>
          <p className="text-[11px] text-red-700 dark:text-red-300 line-clamp-3 leading-relaxed font-medium">{task.admin_note || 'No specific reason provided.'}</p>
        </div>
      ) : task.status === 'Completed' && (task.review || task.rating || task.feedback_notes) ? (
        (() => {
          const rev = task.review || { rating: task.rating, feedback_notes: task.feedback_notes, tags: task.tags || [] };
          return (
            <div className="mt-2 p-2.5 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/50 rounded-xl mb-auto space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-800/80 dark:text-amber-400/80 flex items-center gap-1">
                  <HiSparkles size={11} className="text-amber-500" /> Reviewer Rating
                </span>
                {rev.rating && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-300/40">
                    <FiStar className="fill-amber-500 text-amber-500" size={11} /> {rev.rating}/5
                  </span>
                )}
              </div>
              {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rev.tags.slice(0, 2).map((tg, i) => (
                    <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      {tg}
                    </span>
                  ))}
                  {rev.tags.length > 2 && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">+{rev.tags.length - 2}</span>
                  )}
                </div>
              )}
              {rev.feedback_notes && (
                <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed italic font-medium">
                  "{rev.feedback_notes}"
                </p>
              )}
            </div>
          );
        })()
      ) : stripHtml(task.description).trim().startsWith('{') || stripHtml(task.description).trim().startsWith('[') ? (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600 w-fit mb-auto">
          <FiCode size={14} className="text-primary-500" /> Structured Data Attached
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-medium mb-auto">{stripHtml(task.description)}</p>
      )}
      
      <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}</p>
        </div>
        {task.deadline && (
          <div className="flex flex-col gap-0.5 justify-center items-end text-right">
            <p className={`text-[9px] font-bold uppercase tracking-widest ${
                task.deadline_status === 'overdue' ? 'text-red-500' :
                task.deadline_status === 'due_today' ? 'text-orange-500' :
                'text-amber-500'
              }`}>Due Deadline</p>
            <p className={`text-xs font-bold ${
                task.deadline_status === 'overdue' ? 'text-red-700 dark:text-red-400' :
                task.deadline_status === 'due_today' ? 'text-orange-700 dark:text-orange-400' :
                'text-amber-700 dark:text-amber-400'
              }`}>
              {new Date(task.deadline).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})} 
            </p>
          </div>
        )}
      </div>
      
      {(task.status === 'To-Do' || task.status === 'Rejected') && onStart && (
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(e, task.id); }}
            className={`w-full flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:shadow-lg transition-all ${
              task.status === 'Rejected' ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600'
            }`}
          >
            <FiPlayCircle size={14} /> {task.status === 'Rejected' ? 'Restart Task' : 'Start Task'}
          </button>
        </div>
      )}

      {task.status === 'Unassigned' && onClaim && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onClaim(e, task); }}
            className="w-full flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:shadow-lg transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
          >
            <FiCheckSquare size={14} /> Claim Task
          </button>
        </div>
      )}
      
      {task.status === 'In Progress' && onToggleTimer && formatTimeSpent && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTimer(e, task); }}
            className={`w-full flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all ${
              task.timer_status === 'Running' 
              ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-600 hover:to-indigo-700' 
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {task.timer_status === 'Running' ? (
              <><FiPauseCircle size={14} className="animate-pulse" /> {formatTimeSpent(task)}</>
            ) : (
              <><FiPlayCircle size={14} /> Resume Timer</>
            )}
          </button>
        </div>
      )}

      {task.status === 'In Review' && (
        <div className="mt-3">
          <div className="w-full flex justify-center items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl">
            <FiCheckSquare size={14} /> Under Review
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskCard;
