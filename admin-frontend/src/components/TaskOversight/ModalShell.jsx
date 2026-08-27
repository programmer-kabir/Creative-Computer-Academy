import { createPortal } from 'react-dom';
import { FiX, FiTrash2, FiPlus } from 'react-icons/fi';
export const ModalShell = ({ title, onClose, onSubmit, submitLabel, actionLoading, children, onDelete }) =>
    createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-[1540px] overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {children}

                    {/* Footer Buttons */}
                    <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                        {onDelete && (
                            <button
                                type="button" onClick={onDelete} disabled={actionLoading}
                                className="py-3 px-5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 font-bold rounded-xl transition-all flex items-center justify-center border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 hover:shadow-sm"
                                title="Delete Task"
                            >
                                <FiTrash2 size={20} />
                            </button>
                        )}
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all hover:shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={actionLoading}
                            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 flex justify-center items-center group"
                        >
                            {actionLoading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <span className="flex items-center gap-2 group-hover:scale-105 transition-transform">{submitLabel} <FiPlus size={16} /></span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );