const ChatHeader = ({ activeChat, getDirectRecipient, getChatTitle, API_URL, setIsGroupInfoOpen, getChatSub }) => {
    return (<div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 relative" onClick={() => activeChat.type === 'group' && setIsGroupInfoOpen(true)}>
        <div className="flex items-center gap-3">
            {activeChat.type === 'group' ? (
                activeChat.group_picture ? (
                    <img
                        src={`${API_URL}${activeChat.group_picture}`}
                        alt="Group"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700 shadow-sm"
                    />
                ) : (
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-lg font-black uppercase shadow-sm">
                        {getChatTitle(activeChat).charAt(0)}
                    </div>
                )
            ) : getDirectRecipient(activeChat)?.profile_picture ? (
                <img
                    src={`${API_URL}${getDirectRecipient(activeChat).profile_picture}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-700 shadow-sm"
                />
            ) : (
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-lg font-bold uppercase shadow-sm">
                    {getChatTitle(activeChat).charAt(0)}
                </div>
            )}

            <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{getChatTitle(activeChat)}</h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                    {activeChat.type === 'group' ? (
                        <>
                            <span>{activeChat.participants?.filter(p => p.status !== 'removed').length || 0} Members</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span className="text-emerald-500 font-bold">
                                {activeChat.participants?.filter(p => p.is_online && p.status !== 'removed').length || 0} Online
                            </span>
                        </>
                    ) : (
                        <>
                            <span className={`w-1.5 h-1.5 rounded-full ${activeChat.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span>{activeChat.is_online ? 'Active Now' : 'Offline'}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span>{getChatSub(activeChat)}</span>
                        </>
                    )}
                </p>
            </div>
        </div>
    </div>)
}
export default ChatHeader
