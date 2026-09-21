"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Role } from "@prisma/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@disaster.org");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (role: Role) => {
    const roleEmails: Record<Role, string> = {
      ADMIN: "admin@disaster.org",
      DISASTER_OFFICER: "officer@disaster.org",
      RESOURCE_MANAGER: "manager@disaster.org",
      RELIEF_CAMP_MANAGER: "camp@disaster.org",
      VOLUNTEER: "volunteer@disaster.org",
    };
    setEmail(roleEmails[role]);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl shadow-md mb-1">
            DRRM
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Disaster Relief Resource Management
          </h1>
          <p className="text-xs text-slate-500">
            Emergency Operations & Supply Chain SaaS Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@disaster.org"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-400">Encrypted JWT Session</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Operations Platform"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Presets */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Role Login Presets
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => quickLoginAs(Role.ADMIN)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 text-left flex items-center justify-between"
              >
                <span>1. Admin</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs(Role.DISASTER_OFFICER)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 text-left flex items-center justify-between"
              >
                <span>2. Officer</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs(Role.RESOURCE_MANAGER)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 text-left flex items-center justify-between"
              >
                <span>3. Manager</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs(Role.RELIEF_CAMP_MANAGER)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 text-left flex items-center justify-between"
              >
                <span>4. Camp/Hospital</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => quickLoginAs(Role.VOLUNTEER)}
              className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 text-xs text-center"
            >
              5. Volunteer / Response Team
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Authorized Emergency Response Platform • Role-Based Security Controls
        </p>
      </div>
    </div>
  );
}
