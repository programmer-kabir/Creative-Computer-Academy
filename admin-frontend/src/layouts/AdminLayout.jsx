import React from 'react';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Pusher from 'pusher-js';

const AdminLayout = ({ children }) => {
  const { currentUser } = useAuth();

  React.useEffect(() => {
    if (!currentUser) return;
    
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);
    
    channel.bind('new-notification', function(data) {
      toast.info(data.title, {
        description: data.message,
      });
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">
      <AdminSidebar />
      <div className="flex-1 ml-72 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shadow-sm relative z-50 sticky top-0 transition-colors">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Administrator Console</h2>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell portal="admin" />
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
                {currentUser?.profile_picture ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${currentUser.profile_picture}`}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{currentUser?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
