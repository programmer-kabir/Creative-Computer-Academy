import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { Toaster, toast } from 'sonner';
import Pusher from 'pusher-js';

const AuthenticatedLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';
  
  React.useEffect(() => {
    if (!currentUser) return;
    
    // ⚠️ TODO: Replace with your actual Pusher Key ⚠️
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);
    
    channel.bind('new-notification', function(data) {
      toast.info(data.title, {
        description: data.message,
      });
      // Dispatch custom event so NotificationBell can reload if needed
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Toaster richColors position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm relative z-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Welcome back, {currentUser?.name || 'Staff'}!
          </h2>
          <div className="flex items-center gap-4">
            <NotificationBell portal="staff" />
          </div>
        </header>
        <main className={`flex-1 flex flex-col min-h-0 ${isMessagesPage ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto'}`}>
          <div className={`mx-auto w-full ${isMessagesPage ? 'h-full flex-1 flex flex-col min-h-0' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
