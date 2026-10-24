"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  ShieldCheck,
  Clock,
  PlusCircle,
  Activity,
} from "lucide-react";
import DisasterMap from "@/components/map/DisasterMap";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface DisasterDetail {
  id: string;
  name: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  affectedArea: string;
  latitude: number;
  longitude: number;
  estimatedPopulation: number;
  startDate: string;
  endDate?: string | null;
  createdBy: { id: string; name: string; email: string };
  requests: Array<{
    id: string;
    priority: string;
    status: string;
    justification: string;
    destinationCenter: { id: string; name: string; city: string };
    items: Array<{ id: string; category: string; requestedQuantity: number; fulfilledQuantity: number }>;
  }>;
  volunteers: Array<{
    id: string;
    name: string;
    skills: string;
    availability: string;
    phone: string;
    location: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate?: string | null;
    assignedVolunteer?: { id: string; name: string } | null;
  }>;
}

export default function DisasterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [disaster, setDisaster] = useState<DisasterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDisaster = async () => {
    try {
      const res = await fetch(`/api/disasters/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setDisaster(data.disaster);
      } else {
        showToast("Disaster incident not found", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load incident details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisaster();
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!disaster) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/disasters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: disaster.id,
          status: newStatus,
          endDate: newStatus === "Resolved" ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        showToast(`Disaster status updated to ${newStatus}`, "success");
        fetchDisaster();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error updating status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center gap-2">
          <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!disaster) {
    return (
      <div className="saas-card p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Incident Not Found</h2>
        <p className="text-xs text-slate-500">The requested disaster record does not exist or may have been removed.</p>
        <Link
          href="/disasters"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Disasters Roster
        </Link>
      </div>
    );
  }

  const severityBadge: Record<string, string> = {
    Critical: "badge-critical",
    High: "badge-high",
    Medium: "badge-warning",
    Low: "badge-success",
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Navigation & Status Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            href="/disasters"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Incidents</span>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-600" />
              <span>{disaster.name}</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${severityBadge[disaster.severity] || "badge-warning"}`}>
              {disaster.severity}
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold badge-neutral">
              {disaster.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {disaster.status !== "Resolved" ? (
            <button
              onClick={() => handleStatusChange("Resolved")}
              disabled={updatingStatus}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark as Resolved</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange("Active")}
              disabled={updatingStatus}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Flame className="w-4 h-4" />
              <span>Reactivate Incident</span>
            </button>
          )}

          <Link
            href="/requests"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Requisition</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-500">Disaster Type</span>
          <p className="text-lg font-bold text-slate-900">{disaster.type.replace("_", " ")}</p>
          <p className="text-[11px] text-slate-500 truncate">Zone: {disaster.affectedArea}</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-orange-500">
          <span className="text-xs font-semibold text-slate-500">Est. Population</span>
          <p className="text-lg font-bold text-slate-900">{disaster.estimatedPopulation.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Individuals affected</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500">Resource Requests</span>
          <p className="text-lg font-bold text-slate-900">{disaster.requests.length}</p>
          <p className="text-[11px] text-slate-500">{disaster.requests.filter((r) => r.status === "Pending").length} pending allocation</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500">Response Team</span>
          <p className="text-lg font-bold text-slate-900">{disaster.volunteers.length}</p>
          <p className="text-[11px] text-slate-500">{disaster.tasks.length} tasks scheduled</p>
        </div>
      </div>

      {/* Geospatial Map Preview */}
      <div className="saas-panel p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Incident Geolocation & Hazard Zone</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Lat: {disaster.latitude.toFixed(4)}, Long: {disaster.longitude.toFixed(4)}
          </span>
        </div>
        <DisasterMap disasters={[disaster]} />
      </div>

      {/* Incident Description & Metadata Card */}
      <div className="saas-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Incident Briefing</h3>
        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
          {disaster.description}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Commenced: <strong className="text-slate-800">{new Date(disaster.startDate).toLocaleDateString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Incident Officer: <strong className="text-slate-800">{disaster.createdBy.name}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Status: <strong className="text-slate-800">{disaster.status}</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Linked Requests & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Resource Requests */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Requisitions for this Incident ({disaster.requests.length})
              </h3>
            </div>
            <Link href="/requests" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All →
            </Link>
          </div>

          {disaster.requests.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">No resource requests filed for this disaster yet.</p>
          ) : (
            <div className="space-y-3">
              {disaster.requests.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.destinationCenter.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${severityBadge[r.priority] || "badge-warning"}`}>
                      {r.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{r.justification}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500">Status: <strong className="text-slate-800">{r.status.replace("_", " ")}</strong></span>
                    <Link href={`/requests/${r.id}`} className="text-indigo-600 font-semibold hover:underline">
                      Requisition Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Response Tasks & Volunteers */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Field Operations & Tasks ({disaster.tasks.length})
              </h3>
            </div>
            <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Tasks →
            </Link>
          </div>

          {disaster.tasks.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">No operational field tasks registered yet.</p>
          ) : (
            <div className="space-y-3">
              {disaster.tasks.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === "Completed" ? "badge-success" : t.status === "In_Progress" ? "badge-info" : "badge-neutral"
                    }`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Assigned to: <strong className="text-slate-800">{t.assignedVolunteer?.name || "Unassigned"}</strong></span>
                    {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
