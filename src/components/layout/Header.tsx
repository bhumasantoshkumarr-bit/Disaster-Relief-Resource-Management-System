"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  UserCheck,
  RefreshCw,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";
import { Role } from "@prisma/client";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

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
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";

  const [user, setUser] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleRoleSwitch = async (role: Role) => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setShowRoleMenu(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
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

  // Generate Breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageTitle = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1].replace("-", " ") : "Dashboard";

  const roleBadgeStyles: Record<Role, string> = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
    DISASTER_OFFICER: "bg-rose-50 text-rose-700 border-rose-200",
    RESOURCE_MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
    RELIEF_CAMP_MANAGER: "bg-emerald-50 text-emerald-700 border-emerald-200",
    VOLUNTEER: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-slate-900 capitalize tracking-tight">
            {pageTitle}
          </h1>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-medium capitalize">
            <Link href="/dashboard" className="hover:text-slate-800">Home</Link>
            {pathSegments.map((segment: string, index: number) => (
              <span key={segment} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className={index === pathSegments.length - 1 ? "text-slate-800 font-semibold" : ""}>
                  {segment.replace("-", " ")}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div className="hidden md:flex items-center max-w-xs w-full relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources, requests, disasters..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Switch demo role perspective"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden lg:inline capitalize">
              Role: {user?.role ? user.role.replace("_", " ") : "Switch"}
            </span>
            <RefreshCw className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 mb-1">
                Demo Role Switcher
              </p>
              {Object.values(Role).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    user?.role === r
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize">{r.replace("_", " ")}</span>
                  {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-indigo-600 font-semibold hover:underline">
                    Mark read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-72">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs space-y-1 ${n.isRead ? "bg-white opacity-70" : "bg-indigo-50/40 font-medium"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-tight">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${roleBadgeStyles[user.role]}`}>
                {user.role.replace("_", " ")}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 text-xs">
                <div className="p-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 font-medium"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
