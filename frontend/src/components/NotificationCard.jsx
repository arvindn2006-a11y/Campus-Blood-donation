import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export default function NotificationCard({ notification, onMarkRead }) {
  const isAlert = notification.notification_type === 'EMERGENCY_ALERT';

  return (
    <div className={`glass-card p-4 transition-all ${!notification.is_read ? 'border-rose-500/40 bg-rose-950/10' : 'opacity-85'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isAlert ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-heading font-bold text-white text-sm">
                {notification.notification_type?.replace(/_/g, ' ') || 'Notification'}
              </h5>
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notification.message}</p>
            <span className="text-[10px] text-slate-500 block mt-2">
              {new Date(notification.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {notification.blood_request_id && (
            <Link
              to={`/requests/${notification.blood_request_id}`}
              className="btn-secondary text-xs py-1 px-2.5"
            >
              Respond
            </Link>
          )}
          {!notification.is_read && onMarkRead && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="text-xs text-slate-400 hover:text-white p-1"
              title="Mark as Read"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
