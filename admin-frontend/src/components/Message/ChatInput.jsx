import { FiX, FiPaperclip, FiSend } from 'react-icons/fi';

const ChatInput = ({
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    setTypedMessage,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    amIRemoved,
    handleSendMessage,
    handleTyping,
    isSending,
    typedMessage,
    API_URL,
}) => {
    return (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 flex-shrink-0">
            {replyingTo && (
                <div className="mb-3 p-2 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-l-4 border-indigo-500 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mb-0.5">Replying to {replyingTo.sender_name}</span>
                        <span className="truncate opacity-70">{replyingTo.file_path ? 'Attachment 📎' : replyingTo.message}</span>
                    </div>
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="text-slate-400 hover:text-rose-500 p-1 hover:bg-white/50 rounded-lg transition-all"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            )}

            {editingMessage && (
                <div className="mb-3 p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border-l-4 border-amber-500 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-amber-600 dark:text-amber-400 font-bold mb-0.5 flex items-center gap-1">Editing Message</span>
                        <span className="truncate opacity-70">{editingMessage.message}</span>
                    </div>
                    <button
                        onClick={() => { setEditingMessage(null); setTypedMessage(''); }}
                        className="text-slate-400 hover:text-rose-500 p-1 hover:bg-white/50 rounded-lg transition-all"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            )}

            {selectedFile && (
                <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-600 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <FiPaperclip className="text-primary-600 dark:text-primary-400" />
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-all"
                    >
                        <FiX size={16} />
                    </button>
                </div>
            )}

            {amIRemoved ? (
                <div className="w-full flex items-center justify-center py-2">
                    <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl px-4 py-3 text-sm font-bold w-full text-center flex items-center justify-center gap-2">
                        <FiX size={18} /> You are no longer a participant in this group.
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all flex-shrink-0"
                        title="Attach File"
                    >
                        <FiPaperclip size={18} />
                    </button>

                    <textarea
                        value={typedMessage}
                        onChange={handleTyping}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none max-h-32"
                    />

                    <button
                        type="submit"
                        disabled={isSending || (!typedMessage.trim() && !selectedFile)}
                        className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <FiSend size={18} />
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ChatInput;