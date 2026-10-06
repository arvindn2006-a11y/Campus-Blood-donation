import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import NotificationCard from '../components/NotificationCard';
import { Bell, CheckCheck } from 'lucide-react';
import Toast from '../components/Toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getUserNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setToast({ message: 'All notifications marked as read.', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-black text-3xl text-white">Emergency Alerts & Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Live broadcast alerts and blood matching updates</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass-card p-4 h-20 animate-pulse" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(n => (
            <NotificationCard key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-heading font-bold text-white text-base">No Notifications</p>
          <p className="text-xs text-slate-400 mt-1">You are all caught up! Emergency alerts will appear here in real time.</p>
        </div>
      )}
    </div>
  );
}
