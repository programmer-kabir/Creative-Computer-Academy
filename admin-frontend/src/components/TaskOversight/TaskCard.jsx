import React, { useMemo } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiLink, FiEdit2, FiCalendar, FiCopy, FiFlag } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { extractJsonFromHtml } from './TaskDescriptionRenderer';

export const TaskCard = ({ task, isReview, apiBase, onEdit, onDuplicate, onViewHistory, onOpenDetails, onStatusChange, onReject, actionLoading, innerRef, draggableProps, dragHandleProps, isDragging }) => {
    const { jsonData, remainingHtml, hasRemainingText } = useMemo(() => extractJsonFromHtml(task.description || ''), [task.description]);

    return (
    <div
        ref={innerRef}
        {...draggableProps}
        {...dragHandleProps}
        onClick={() => onOpenDetails(task)}
        className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 flex flex-col h-full transition-all duration-300 ease-out cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 overflow-hidden
      ${isDragging
                ? 'shadow-2xl border-blue-400 ring-4 ring-blue-500/10 scale-[1.02] rotate-1 z-50 bg-white dark:bg-slate-800 cursor-grabbing'
                : 'border-slate-200 dark:border-slate-700 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1'
            }`}
    >
        {/* Thumbnail Image */}
        <div className="w-[calc(100%+2.5rem)] h-40 -mt-5 -mx-5 mb-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 rounded-t-2xl overflow-hidden flex-shrink-0 relative group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-colors">
            {(() => {
                let firstImg = null;
                if (task.visual_image) {
                    try {
                        const parsed = Array.isArray(task.visual_image) ? task.visual_image : JSON.parse(task.visual_image);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            firstImg = parsed[0];
                        } else if (typeof parsed === 'string' && parsed) {
                            firstImg = parsed;
                        }
                    } catch (e) {
                        firstImg = typeof task.visual_image === 'string' ? task.visual_image : null;
                    }
                }

                if (firstImg) {
                    return <img src={`${apiBase}${firstImg}`} alt="Task Thumbnail" className="w-full h-full object-contain bg-white hover:scale-105 transition-transform duration-500" />;
                }

                return (
                    <img src="/no-image-placeholder.jpg" alt="No Image Available" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                );
            })()}
        </div>

        {/* Header row */}
        <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {/* Status Badge */}
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${task.status === 'In Review' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' :
                    task.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                        task.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                    }`}>
                    {task.status}
                </span>

                {/* Self-Initiated Creative Badge */}
                {(Number(task.is_self_created) === 1 || task.is_self_created === true) && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-md border flex items-center gap-1 uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">
                        <HiSparkles size={12} className="text-amber-500" /> Self-Initiative
                    </span>
                )}

                {/* Agentic AI Blueprint Badge */}
                {(task.creation_mode === 'agentic' || Boolean(task.blueprint_data)) && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-md border flex items-center gap-1 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30">
                        <HiSparkles size={11} className="text-amber-400" /> AI Blueprint
                    </span>
                )}

                {/* Priority Badge */}
                {task.priority && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                        task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                        }`}>
                        <FiFlag size={10} /> {task.priority}
                    </span>
                )}

                {/* Category Badge */}
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 uppercase tracking-wider truncate max-w-[90px]">
                    {task.category}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-0.5 border border-slate-100 dark:border-slate-700 shadow-sm">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewHistory(task); }}
                    title="View Task Logs"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-md transition-all"
                >
                    <FiClock size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(task); }}
                    title="Duplicate Task"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-md transition-all"
                >
                    <FiCopy size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    title="Edit Task"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-md transition-all"
                >
                    <FiEdit2 size={14} />
                </button>
            </div>
        </div>

        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-2">{task.title}</h3>

        {task.submission_link && (
            <div className="mb-3">
                <a
                    href={task.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold text-xs rounded-xl transition-colors w-full"
                >
                    <FiLink size={13} className="text-emerald-500" />
                    <span className="truncate flex-1 text-left">View Submitted Work</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 text-white rounded font-bold uppercase tracking-wide flex-shrink-0">LINK</span>
                </a>
            </div>
        )}

        <div
            className="text-sm text-slate-600 mb-4 flex-1 overflow-hidden relative flex flex-col gap-2"
            style={{ maxHeight: '100px' }}
        >
            {jsonData ? (
                <div className="flex items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-400 flex-shrink-0">
                    <FiCheckCircle className="text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Structured Data Attached</span>
                </div>
            ) : null}

            {hasRemainingText && remainingHtml ? (
                <div className="relative flex-1 overflow-hidden">
                    <div className="task-description-content text-xs line-clamp-3 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: remainingHtml }} />
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none" />
                </div>
            ) : !jsonData ? (
                <p className="italic text-slate-400 text-xs">No description provided.</p>
            ) : null}
        </div>

        {/* Assigned-to badge & Assign Date */}
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 gap-2">
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600">
                    {task.assigned_to_avatar ? (
                        <img src={`${apiBase}${task.assigned_to_avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase">
                            {task.assigned_to_name ? task.assigned_to_name.charAt(0) : '?'}
                        </div>
                    )}
                </div>
                <div className="overflow-hidden min-w-0 pr-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Assigned To</p>
                    <p className="text-xs font-bold text-slate-700 truncate leading-none">{task.assigned_to_name || 'Unassigned'}</p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 uppercase tracking-wider shadow-sm">
                    <FiCalendar size={11} className="text-slate-400" />
                    {new Date(task.assign_date || task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                {task.deadline && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-wider shadow-sm 
            ${new Date() > new Date(task.deadline + 'T' + (task.deadline_time || '23:59:59')) ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 animate-pulse' :
                            new Date().toISOString().split('T')[0] === task.deadline ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' :
                                'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'}`}>
                        <FiClock size={11} />
                        {new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                )}
            </div>
        </div>

        {isReview && (
            <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'Completed'); }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                    <FiCheckCircle size={16} /> Approve
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(task); }}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                    <FiXCircle size={16} /> Reject
                </button>
            </div>
        )}
    </div>
    );
};
