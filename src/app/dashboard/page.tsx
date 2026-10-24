"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DisasterMap from "@/components/map/DisasterMap";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  Flame,
  Users,
  AlertTriangle,
  Boxes,
  Truck,
  FileCheck,
  TrendingUp,
  PlusCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  metrics: {
    activeDisasters: number;
    affectedPopulation: number;
    pendingRequests: number;
    criticalRequests: number;
    totalResources: number;
    lowStockItems: number;
    activeDeliveries: number;
    totalVolunteers: number;
    totalRequests?: number;
    fulfilledRequests?: number;
    fulfillmentRate?: number;
  };
  charts: {
    disastersBySeverity: Array<{ name: string; value: number }>;
    disastersByType: Array<{ name: string; value: number }>;
    resourcesByCategory: Array<{ name: string; quantity: number; itemsCount: number }>;
    requestsByStatus: Array<{ name: string; value: number }>;
    deliveriesByStatus: Array<{ name: string; value: number }>;
  };
}

interface DisasterItem {
  id: string;
  name: string;
  type: string;
  severity: string;
  affectedArea: string;
  latitude: number;
  longitude: number;
  estimatedPopulation: number;
  status: string;
}

interface RequestItem {
  id: string;
  priority: string;
  justification: string;
  status: string;
  requestedDate: string;
  destinationCenter: { name: string; city: string };
  disaster: { name: string };
  items: Array<{ category: string; requestedQuantity: number; fulfilledQuantity: number }>;
}

interface WarehouseItem {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentUtilization: number;
}

interface ReliefCenterItem {
  id: string;
  name: string;
  type: string;
  city: string;
  latitude: number;
  longitude: number;
  currentPopulation: number;
  emergencyLevel: string;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#10b981", "#6366f1", "#8b5cf6"];

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [disasters, setDisasters] = useState<DisasterItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [reliefCenters, setReliefCenters] = useState<ReliefCenterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, disastersRes, requestsRes, warehousesRes, centersRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/disasters"),
        fetch("/api/requests"),
        fetch("/api/warehouses"),
        fetch("/api/relief-centers"),
      ]);

      if (analyticsRes.ok) setData(await analyticsRes.json());
      if (disastersRes.ok) {
        const res = await disastersRes.json();
        setDisasters(res.disasters || []);
      }
      if (requestsRes.ok) {
        const res = await requestsRes.json();
        setRequests(res.requests || []);
      }
      if (warehousesRes.ok) {
        const res = await warehousesRes.json();
        setWarehouses(res.warehouses || []);
      }
      if (centersRes.ok) {
        const res = await centersRes.json();
        setReliefCenters(res.centers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 bg-slate-200 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    activeDisasters: 0,
    affectedPopulation: 0,
    pendingRequests: 0,
    criticalRequests: 0,
    totalResources: 0,
    lowStockItems: 0,
    activeDeliveries: 0,
    totalVolunteers: 0,
    totalRequests: 0,
    fulfilledRequests: 0,
    fulfillmentRate: 0,
  };

  const criticalRequestsList = requests.filter((r) => r.priority === "Critical" || r.status === "Pending");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase badge-critical">
              Live Operations Mode
            </span>
            <span className="text-xs text-slate-500 font-medium">Emergency SaaS Platform</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Operations Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/requests"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Requisition</span>
          </Link>
          <Link
            href="/disasters"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Manage Disasters</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Active Disasters */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Incidents</span>
            <Flame className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.activeDisasters}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-critical">Active</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">{metrics.affectedPopulation.toLocaleString()} affected</p>
        </div>

        {/* Affected Population */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Affected Pop.</span>
            <Users className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.affectedPopulation.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Zone aggregate</p>
        </div>

        {/* Critical Requests */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Critical Requests</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.criticalRequests}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-warning">Urgent</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">{metrics.pendingRequests} Pending</p>
        </div>

        {/* Available Resources */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Inventory Items</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.totalResources}
            </span>
            {metrics.lowStockItems > 0 && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-warning">
                {metrics.lowStockItems} Low
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 truncate">Warehouses</p>
        </div>

        {/* Pending Deliveries */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Convoys Active</span>
            <Truck className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.activeDeliveries}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-info">In Transit</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Supply logistics</p>
        </div>

        {/* Active Volunteers */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Responders</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.totalVolunteers}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-success">Field</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">Volunteers</p>
        </div>

        {/* Fulfillment Rate */}
        <div className="saas-card p-3.5 space-y-1.5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Fulfillment</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900">
              {metrics.fulfillmentRate || 0}%
            </span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded badge-success">Rate</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate">{metrics.fulfilledRequests || 0} of {metrics.totalRequests || 0} fulfilled</p>
        </div>
      </div>

      {/* Geospatial Situation Map Section */}
      <div className="saas-panel p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Live Operational Map</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Disasters</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Warehouses</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Relief Camps</span>
            <Link href="/map" className="text-indigo-600 font-semibold hover:underline ml-2">Full Screen Map →</Link>
          </div>
        </div>

        <DisasterMap
          disasters={disasters}
          warehouses={warehouses}
          reliefCenters={reliefCenters}
        />
      </div>

      {/* Dashboard Section 1 & 2: Emergency Overview & Critical Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Emergency Overview Table */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Emergency Incidents Overview</h3>
            </div>
            <Link href="/disasters" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Incident</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Affected Pop</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {disasters.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{d.name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.affectedArea}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.severity === "Critical" ? "badge-critical" : d.severity === "High" ? "badge-high" : "badge-warning"
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{d.estimatedPopulation.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Link href="/disasters" className="text-indigo-600 hover:underline font-semibold">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Critical Requisitions List */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Critical Resource Requests</h3>
            </div>
            <Link href="/requests" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              <span>View All Requests</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {criticalRequestsList.slice(0, 4).map((req) => (
              <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.destinationCenter.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      req.priority === "Critical" ? "badge-critical" : "badge-high"
                    }`}>
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate max-w-xs">{req.justification}</p>
                </div>
                <Link
                  href="/requests"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shrink-0"
                >
                  Allocate
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts 1: Resource Stock Category Distribution */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stock Quantities by Category</h3>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.resourcesByCategory || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="quantity" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts 2: Requests Status Pie Chart */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Requisition Status Breakdown</h3>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts.requestsByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.charts.requestsByStatus || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
