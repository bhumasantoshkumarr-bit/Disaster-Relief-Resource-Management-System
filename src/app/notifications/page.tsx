"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Check, Filter } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        showToast("All notifications marked as read", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => (unreadOnly ? !n.isRead : true));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Emergency Operations Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time system alerts regarding critical requisitions, low stock warnings, and delivery dispatch updates.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4 text-indigo-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="saas-card p-4 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span>Unread Notifications Only ({notifications.filter((n) => !n.isRead).length})</span>
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="saas-card p-8 text-center text-slate-500 text-xs">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`saas-card p-4 flex items-start justify-between gap-4 text-xs ${
                n.isRead ? "bg-white opacity-70" : "bg-indigo-50/30 border-indigo-200 font-medium"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => markSingleRead(n.id)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-semibold shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
