"use client";

import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Database, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserSession | null>(null);
  const [phone, setPhone] = useState("+91 90000 00001");
  const [alertCritical, setAlertCritical] = useState(true);
  const [alertInventory, setAlertInventory] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Settings and profile preferences saved", "success");
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Account & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage profile configurations, notification preferences, and system parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">User Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || "Loading..."}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || "Loading..."}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">System Role</label>
              <input
                type="text"
                disabled
                value={user?.role?.replace("_", " ") || "VOLUNTEER"}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold uppercase cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Contact Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Emergency Alert Preferences</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Critical Requisition Alerts</p>
                <p className="text-slate-500 text-[11px]">Receive instant in-app alerts when high-priority resource requests arrive.</p>
              </div>
              <input
                type="checkbox"
                checked={alertCritical}
                onChange={(e) => setAlertCritical(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Low Inventory Warnings</p>
                <p className="text-slate-500 text-[11px]">Receive notifications when warehouse stock drops below minimum threshold level.</p>
              </div>
              <input
                type="checkbox"
                checked={alertInventory}
                onChange={(e) => setAlertInventory(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
            </label>
          </div>
        </div>

        {/* System Details */}
        <div className="saas-card p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">System Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-slate-600">
            <div>Framework: <span className="font-bold text-slate-900">Next.js 15 App Router</span></div>
            <div>Database ORM: <span className="font-bold text-slate-900">Prisma Client</span></div>
            <div>Authentication: <span className="font-bold text-slate-900">Encrypted JWT Session Cookie</span></div>
            <div>Environment: <span className="font-bold text-emerald-600">Production Mode</span></div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
