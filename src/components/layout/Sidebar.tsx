"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flame,
  FileCheck,
  Boxes,
  Warehouse,
  Home,
  Truck,
  Users,
  CheckSquare,
  MapPin,
  BarChart3,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { Role } from "@prisma/client";

interface SidebarProps {
  userRole?: Role;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ userRole = Role.ADMIN, isOpenMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const primaryLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: Object.values(Role) },
    { name: "Disasters", href: "/disasters", icon: Flame, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.VOLUNTEER] },
    { name: "Resource Requests", href: "/requests", icon: FileCheck, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.RESOURCE_MANAGER, Role.RELIEF_CAMP_MANAGER] },
    { name: "Resources", href: "/inventory", icon: Boxes, roles: [Role.ADMIN, Role.RESOURCE_MANAGER, Role.DISASTER_OFFICER] },
    { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: [Role.ADMIN, Role.RESOURCE_MANAGER, Role.DISASTER_OFFICER] },
    { name: "Relief Centers", href: "/camps", icon: Home, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.RELIEF_CAMP_MANAGER] },
    { name: "Deliveries", href: "/deliveries", icon: Truck, roles: [Role.ADMIN, Role.RESOURCE_MANAGER, Role.RELIEF_CAMP_MANAGER, Role.DISASTER_OFFICER] },
    { name: "Volunteers", href: "/volunteers", icon: Users, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.VOLUNTEER] },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.VOLUNTEER] },
    { name: "Operational Map", href: "/map", icon: MapPin, roles: Object.values(Role) },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: [Role.ADMIN, Role.DISASTER_OFFICER, Role.RESOURCE_MANAGER] },
    { name: "Notifications", href: "/notifications", icon: Bell, roles: Object.values(Role) },
  ];

  const adminLinks = [
    { name: "Users", href: "/users", icon: ShieldCheck, roles: [Role.ADMIN] },
    { name: "Audit Logs", href: "/audit-logs", icon: ShieldAlert, roles: [Role.ADMIN] },
    { name: "Settings", href: "/settings", icon: Settings, roles: Object.values(Role) },
  ];

  const filterLinks = (links: typeof primaryLinks) =>
    links.filter((l) => l.roles.includes(userRole));

  const filteredPrimary = filterLinks(primaryLinks);
  const filteredAdmin = filterLinks(adminLinks);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-indigo-700 transition-colors">
            DRRM
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight">
              DRRM System
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Disaster Relief Management
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden text-slate-500 hover:text-slate-800 p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Operations
          </p>
          {filteredPrimary.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-bold border-r-2 border-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {filteredAdmin.length > 0 && (
          <div className="space-y-1 border-t border-slate-100 pt-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Administration
            </p>
            {filteredAdmin.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-bold border-r-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] font-semibold text-slate-700">SaaS Live Instance</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Role: {userRole.replace("_", " ")}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 hidden md:block fixed left-0 top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-64 max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
}
