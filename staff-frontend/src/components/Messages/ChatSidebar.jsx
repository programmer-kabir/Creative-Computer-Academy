import React from 'react';
import { FiSearch, FiMessageSquare, FiPlus } from 'react-icons/fi';

const ChatSidebar = ({
  activeChat,
  admins,
  contactingAdmin,
  handleContactAdmin,
  searchChat,
  setSearchChat,
  loadingChats,
  filteredChats,
  getDirectRecipient,
  getChatTitle,
  getChatSub,
  setActiveChat,
  setIsNewChatModalOpen,
  API_URL,
}) => {
  return (
    <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 flex flex-col h-full transition-all duration-300 z-20 ${activeChat ? 'hidden md:flex' : 'flex'
      }`}>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Chats</h2>
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-9 h-9 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 rounded-xl flex items-center justify-center transition-all shadow-sm"
          title="Start New Chat"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {/* Quick Contact Admin Section */}
      {admins.length > 0 && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">📞 Contact Admin</p>
          <div className="space-y-1.5">
            {admins.map((admin) => (
              <button
                key={admin.id}
                onClick={() => handleContactAdmin(admin)}
                disabled={contactingAdmin === admin.id}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 overflow-hidden" style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px' }}>
                  {admin.profile_picture ? (
                    <img
                      src={`${API_URL}${admin.profile_picture}`}
                      alt={admin.name}
                      style={{ width: '32px', height: '32px', minWidth: '32px', objectFit: 'cover', display: 'block' }}
                      className="rounded-full"
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', minWidth: '32px' }} className="bg-blue-500/20 text-blue-300 rounded-lg flex items-center justify-center text-xs font-black uppercase">
                      {admin.name.charAt(0)}
                    </div>
                  )}
                  {/* Online indicator */}
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-800 ${admin.is_online ? 'bg-emerald-400' : 'bg-slate-600'
                    }`} style={{ width: '8px', height: '8px', bottom: '-1px', right: '-1px' }}></span>
                </div>

                {/* Info */}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{admin.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    {admin.is_online ? '🟢 Active Now' : '⚫ Offline'}
                  </p>
                </div>

                {/* Arrow or spinner */}
                {contactingAdmin === admin.id ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0"></div>
                ) : (
                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Chats */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchChat}
            onChange={(e) => setSearchChat(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageSquare size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No active chats found</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-3 text-xs text-primary-600 dark:text-primary-400 font-extrabold hover:underline"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChat && activeChat.id === chat.id;
            const recipient = getDirectRecipient(chat);
            const unread = chat.unread_count > 0;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700/30 cursor-pointer transition-all duration-300 group hover:scale-[1.01] ${isActive
                  ? 'bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent border-l-4 border-l-primary-600 shadow-sm'
                  : 'hover:bg-white dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                  }`}
              >
                {/* Avatar / Icon */}
                <div className="relative flex-shrink-0 overflow-hidden" style={{ width: '44px', height: '44px', minWidth: '44px' }}>
                  {chat.type === 'group' ? (
                    chat.group_picture ? (
                      <img
                        src={`${API_URL}${chat.group_picture}`}
                        alt="Group"
                        style={{ width: '44px', height: '44px', minWidth: '44px', objectFit: 'cover', display: 'block', borderRadius: '50%' }}
                      />
                    ) : (
                      <div style={{ width: '44px', height: '44px' }} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-lg font-black uppercase shadow-sm">
                        {getChatTitle(chat).charAt(0)}
                      </div>
                    )
                  ) : recipient?.profile_picture ? (
                    <img
                      src={`${API_URL}${recipient.profile_picture}`}
                      alt="Profile"
                      style={{ width: '44px', height: '44px', minWidth: '44px', objectFit: 'cover', display: 'block', borderRadius: '50%' }}
                    />
                  ) : (
                    <div style={{ width: '44px', height: '44px' }} className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-lg font-black uppercase shadow-sm">
                      {getChatTitle(chat).charAt(0)}
                    </div>
                  )}

                  {/* Online Dot (only for direct chats) */}
                  {chat.type === 'direct' && chat.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                  )}
                </div>

                {/* Room Details */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-bold truncate ${unread ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>
                      {getChatTitle(chat)}
                    </p>
                    {chat.last_message_time && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        {new Date(chat.last_message_time.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate max-w-[140px] ${unread ? 'text-slate-800 dark:text-slate-100 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}>
                      {chat.last_message_file_path ? 'Attachment 📎' : chat.last_message || getChatSub(chat)}
                    </p>
                    {unread && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm min-w-5 text-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
