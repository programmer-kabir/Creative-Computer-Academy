import React from 'react';
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi';

const MessageInput = ({
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  selectedFile,
  setSelectedFile,
  amIRemoved,
  handleSendMessage,
  fileInputRef,
  typedMessage,
  setTypedMessage,
  handleTyping,
  showEmojiPickerId,
  setShowEmojiPickerId,
  emojis,
  isSending,
}) => {
  return (
    <div className="p-4 md:p-6 bg-transparent relative z-10 w-full flex-shrink-0 pb-4 md:pb-8">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] rounded-[24px] p-2 mx-auto w-full relative flex flex-col">

        {/* Replying To Banner */}
        {replyingTo && (
          <div className="mb-2 p-2 mx-2 mt-1 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-l-4 border-indigo-500 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex flex-col overflow-hidden">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold mb-0.5">Replying to {replyingTo.sender_name}</span>
              <span className="truncate opacity-70">{replyingTo.file_path ? 'Attachment 📎' : replyingTo.message}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Editing Message Banner */}
        {editingMessage && (
          <div className="mb-2 p-2 mx-2 mt-1 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border-l-4 border-amber-500 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex flex-col overflow-hidden">
              <span className="text-amber-600 dark:text-amber-400 font-bold mb-0.5 flex items-center gap-1">Editing Message</span>
              <span className="truncate opacity-70">{editingMessage.message}</span>
            </div>
            <button
              onClick={() => { setEditingMessage(null); setTypedMessage(''); }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Selected File Label */}
        {selectedFile && (
          <div className="mb-2 p-2 mx-2 mt-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FiPaperclip className="text-primary-600 dark:text-primary-400" />
              <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-all"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {amIRemoved ? (
          <div className="w-full flex items-center justify-center py-3">
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl px-4 py-3 text-sm font-bold w-full mx-2 text-center flex items-center justify-center gap-2">
              <FiX size={18} /> You are no longer a participant in this group.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative px-1 pb-1 pt-1">

            {/* File Upload Button */}
            <div className="relative mb-1">
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                ref={fileInputRef}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                title="Attach file"
              >
                <FiPaperclip size={20} />
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 focus-within:border-primary-500/50 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-inner">
              <textarea
                value={typedMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-slate-700 dark:text-slate-200 py-3 pl-4 pr-10 focus:outline-none resize-none max-h-32 min-h-[44px] text-sm"
                rows="1"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPickerId(showEmojiPickerId === 'main' ? null : 'main')}
                className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-primary-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>

              {/* Main Emoji Picker Dropdown */}
              {showEmojiPickerId === 'main' && (
                <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl p-2 flex gap-1 z-50 border border-slate-100 dark:border-slate-700 animate-in zoom-in duration-200">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setTypedMessage(prev => prev + emoji);
                        setShowEmojiPickerId(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || (!typedMessage.trim() && !selectedFile)}
              className="w-11 h-11 mb-0.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiSend size={18} className="ml-0.5 mt-0.5" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
