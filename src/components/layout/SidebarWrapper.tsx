"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ToastProvider } from "@/components/ui/Toast";
import { Role } from "@prisma/client";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname === "/";
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) setRole(data.user.role);
      })
      .catch((e) => console.error(e));
  }, [pathname]);

  if (isLoginPage) {
    return (
      <ToastProvider>
        <main className="min-h-screen bg-slate-50">{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Sidebar
          userRole={role}
          isOpenMobile={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="md:pl-60 flex-1 flex flex-col min-w-0">
          <Header onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="p-4 md:p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
