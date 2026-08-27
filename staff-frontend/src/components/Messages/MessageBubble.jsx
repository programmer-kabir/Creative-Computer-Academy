import React from 'react';
import { FiMessageSquare, FiFile, FiCheck } from 'react-icons/fi';

const MessageBubble = ({
  msg,
  index,
  currentUser,
  activeChat,
  API_URL,
  activeDropdown,
  setActiveDropdown,
  showEmojiPickerId,
  setShowEmojiPickerId,
  emojis,
  handleReact,
  setReplyingTo,
  setForwardingMessage,
  setForwardModalOpen,
  setForwardSelectedTargets,
  setForwardSearchQuery,
  setEditingMessage,
  setTypedMessage,
  setInfoMessage,
  setMessageToDelete,
  setLightboxImage,
}) => {
  const isMe = msg.sender_id === currentUser.id;
  const isImage = msg.file_path && msg.file_path.match(/\.(jpeg|jpg|gif|png)$/i);

  // Calculate ticks
  let tickStatus = 0; // 0=none, 1=single grey, 2=double grey, 3=double blue
  if (isMe && msg.receipts) {
    const total = msg.receipts.length;
    if (total === 0) {
      tickStatus = 1;
    } else {
      const delivered = msg.receipts.filter(r => r.delivered_at).length;
      const read = msg.receipts.filter(r => r.read_at).length;

      if (read === total) tickStatus = 3;
      else if (delivered === total) tickStatus = 2;
      else tickStatus = 1;
    }
  }

  const isSystemMessage = msg.message && msg.message.startsWith('__SYSTEM__:');
  if (isSystemMessage) {
    const systemText = msg.message.replace('__SYSTEM__:', '');
    return (
      <div key={msg.id || index} className="flex justify-center my-4 w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-sm text-center max-w-[80%]">
          {systemText}
        </div>
      </div>
    );
  }

  return (
    <div
      key={msg.id || index}
      className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
    >
      {/* Avatar (only for others) */}
      {!isMe && (
        <div className="flex-shrink-0" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
          {msg.sender_profile_picture ? (
            <img
              src={`${API_URL}${msg.sender_profile_picture}`}
              alt="Sender"
              style={{ width: '32px', height: '32px', minWidth: '32px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
            />
          ) : (
            <div style={{ width: '32px', height: '32px', minWidth: '32px' }} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center text-xs font-black uppercase shadow-sm">
              {msg.sender_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className="flex flex-col relative group"
        onMouseLeave={() => setActiveDropdown(null)}
      >
        {/* Name (for group chats from others) */}
        {!isMe && activeChat?.type === 'group' && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1 ml-1">{msg.sender_name}</span>
        )}

        <div className={`relative p-3.5 sm:p-4 rounded-2xl shadow-sm text-sm pr-14 transition-all ${isMe
          ? 'bg-primary-600 text-white rounded-tr-[4px]'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-[4px]'
          } ${msg.reactions?.length > 0 ? 'mb-4' : ''}`}>
          {/* Forwarded Badge */}
          {msg.is_forwarded === 1 && !msg.is_deleted && (
            <div className={`flex items-center gap-1 text-[10px] font-bold italic mb-1.5 opacity-75 ${isMe ? 'text-white' : 'text-slate-400'}`}>
              <FiMessageSquare size={10} className="rotate-180" /> Forwarded
            </div>
          )}

          {/* Dropdown Trigger Icon */}
          {!msg.is_deleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === msg.id ? null : msg.id);
              }}
              className={`absolute top-1 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeDropdown === msg.id ? 'opacity-100 bg-black/10 dark:bg-white/10' : ''
                } ${isMe ? 'hover:bg-black/20 text-white/80 hover:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          )}

          {/* Reaction Trigger Icon */}
          {!msg.is_deleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPickerId(showEmojiPickerId === msg.id ? null : msg.id);
                setActiveDropdown(null);
              }}
              className={`absolute top-2 right-7 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${showEmojiPickerId === msg.id ? 'opacity-100 bg-black/10 dark:bg-white/10' : ''
                } ${isMe ? 'hover:bg-black/20 text-white/80 hover:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          )}

          {/* Dropdown Menu */}
          {activeDropdown === msg.id && !msg.is_deleted && (
            <div
              className={`absolute top-8 right-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveDropdown(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Reply
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setForwardingMessage(msg);
                  setForwardModalOpen(true);
                  setForwardSelectedTargets({ users: [], chats: [] });
                  setForwardSearchQuery('');
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
              >
                Forward
              </button>
              {isMe && !msg.file_path && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMessage(msg);
                    setTypedMessage(msg.message);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                >
                  Edit
                </button>
              )}
              {isMe && (
                <button
                  onClick={(e) => { e.stopPropagation(); setInfoMessage(msg); setActiveDropdown(null); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                >
                  Message Info
                </button>
              )}
              {isMe && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMessageToDelete(msg.id); setActiveDropdown(null); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-slate-100 dark:border-slate-700"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Replied Message Block */}
          {msg.reply_to_id && (
            <div
              className={`mb-2 p-2 rounded-lg text-xs border-l-4 opacity-80 ${isMe
                ? 'bg-white/10 border-white/40'
                : 'bg-slate-100 dark:bg-slate-700/50 border-primary-500'
                }`}
            >
              <p className="font-bold mb-0.5 truncate">{msg.reply_to_name || 'User'}</p>
              <p className="truncate opacity-80">{msg.reply_to_file ? 'Attachment 📎' : msg.reply_to_message}</p>
            </div>
          )}

          {/* File Attachment */}
          {msg.file_path && (
            <div className="mb-2">
              {isImage ? (
                <img
                  src={`${API_URL}${msg.file_path}`}
                  alt="Attached Image"
                  onClick={() => setLightboxImage(msg.file_path)}
                  className="max-w-xs max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700/80 cursor-zoom-in hover:brightness-95 transition-all shadow-inner"
                />
              ) : (
                <a
                  href={`${API_URL}${msg.file_path}`}
                  download={msg.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${isMe
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700'
                    }`}
                >
                  <FiFile className="text-lg flex-shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold truncate max-w-[150px]">{msg.file_name}</p>
                    <p className="text-[10px] opacity-70">Click to Open / Download</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Message Text */}
          {msg.message && (
            <p className={`leading-relaxed whitespace-pre-wrap ${msg.is_deleted ? 'italic opacity-60' : ''}`}>
              {msg.message}
              {msg.is_edited === 1 && !msg.is_deleted && (
                <span className="text-[9px] opacity-60 ml-1 italic inline-block">(edited)</span>
              )}
            </p>
          )}

          {/* Emoji Picker Popup */}
          {showEmojiPickerId === msg.id && !msg.is_deleted && (
            <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 bg-white dark:bg-slate-800 backdrop-blur-xl rounded-full shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-200`}>
              {emojis.map(emoji => {
                const isSelected = msg.reactions?.some(r => r.user_id === currentUser.id && r.reaction === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(msg.id, emoji);
                    }}
                    className={`w-8 h-8 flex items-center justify-center text-lg rounded-full transition-all hover:scale-125 transform ${isSelected ? 'bg-blue-100 dark:bg-blue-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reactions Badge */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-[10px] animate-in zoom-in duration-200 z-10`}>
              {Array.from(new Set(msg.reactions.map(r => r.reaction))).map(emoji => (
                <span key={emoji} className="inline-block">{emoji}</span>
              ))}
              <span className="text-slate-500 dark:text-slate-400 font-bold ml-0.5">
                {msg.reactions.length > 1 ? msg.reactions.length : ''}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp & Ticks */}
        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            {new Date(msg.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Receipt Ticks (WhatsApp Style) */}
          {isMe && (
            <div className="group relative flex items-center cursor-pointer p-0.5">
              {tickStatus === 1 && <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />}
              {tickStatus === 2 && (
                <div className="flex -space-x-1.5">
                  <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />
                  <FiCheck className="text-slate-400 dark:text-slate-500 text-xs" />
                </div>
              )}
              {tickStatus === 3 && (
                <div className="flex -space-x-1.5">
                  <FiCheck className="text-blue-500 text-xs" />
                  <FiCheck className="text-blue-500 text-xs" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;