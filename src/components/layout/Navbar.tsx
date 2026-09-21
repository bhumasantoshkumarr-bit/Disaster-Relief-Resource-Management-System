"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Bell, LogOut, RefreshCw, UserCheck, CheckCircle2 } from "lucide-react";
import { Role } from "@prisma/client";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleRoleSwitch = async (role: Role) => {
    setLoadingRole(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowRoleMenu(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnreadCount(0);
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const roleColors: Record<Role, string> = {
    ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    DISASTER_OFFICER: "bg-red-500/20 text-red-300 border-red-500/40",
    RESOURCE_MANAGER: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    RELIEF_CAMP_MANAGER: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    VOLUNTEER: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  };

  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 fixed top-0 left-0 right-0 z-30 px-4 md:px-6 flex items-center justify-between backdrop-blur-md">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-sm tracking-tight leading-none group-hover:text-cyan-400 transition-colors">
              DISASTER RELIEF
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
              Resource Management System
            </span>
          </div>
        </Link>
      </div>

      {/* Right Header Options */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 transition-colors"
            title="Switch demo role for evaluation"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="capitalize">{user?.role ? user.role.replace("_", " ") : "Switch Role"}</span>
            <RefreshCw className={`w-3 h-3 ml-1 text-slate-400 ${loadingRole ? "animate-spin" : ""}`} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <p className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 mb-1">
                Demo Role Switcher
              </p>
              {Object.values(Role).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    user?.role === r
                      ? "bg-cyan-500/20 text-cyan-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="capitalize">{r.replace("_", " ")}</span>
                  {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase">System Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-72">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs space-y-1 ${n.isRead ? "bg-slate-900/40 opacity-75" : "bg-slate-800/40"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-tight">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Logout */}
        {user && (
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{user.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${
                  roleColors[user.role] || "bg-slate-800 text-slate-300"
                }`}
              >
                {user.role.replace("_", " ")}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
