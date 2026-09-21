"use client";

import { useState, useEffect } from "react";
import { BarChart3, Calendar, Download, TrendingUp, Boxes, Users, Truck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ReportData {
  timeframe: string;
  metrics: {
    disastersCount: number;
    totalRequests: number;
    fulfilledRequests: number;
    pendingRequests: number;
    fulfillmentRate: number;
  };
  deliveryPerformance: {
    total: number;
    delivered: number;
    inTransit: number;
    delayed: number;
  };
  warehouseUtilization: Array<{ name: string; capacity: number; utilization: number }>;
  volunteerParticipation: Array<{ status: string; count: number }>;
  resourceCategoryDistribution: Array<{ category: string; quantity: number }>;
}

const COLORS = ["#10b981", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchReports = async (tf: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?timeframe=${tf}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(timeframe);
  }, [timeframe]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Operational Analytics & Relief Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit request fulfillment rates, delivery performance, warehouse utilization, and resource distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-12 text-center text-slate-400 text-xs">Generating analytics reports...</div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="saas-card p-4 space-y-1 border-l-4 border-l-emerald-500">
              <span className="text-xs font-semibold text-slate-500">Fulfillment Rate</span>
              <p className="text-2xl font-bold text-slate-900">{data.metrics.fulfillmentRate}%</p>
              <p className="text-[11px] text-slate-500">{data.metrics.fulfilledRequests} of {data.metrics.totalRequests} fulfilled</p>
            </div>

            <div className="saas-card p-4 space-y-1 border-l-4 border-l-indigo-500">
              <span className="text-xs font-semibold text-slate-500">Incidents Tracked</span>
              <p className="text-2xl font-bold text-slate-900">{data.metrics.disastersCount}</p>
              <p className="text-[11px] text-slate-500">Active & monitoring</p>
            </div>

            <div className="saas-card p-4 space-y-1 border-l-4 border-l-sky-500">
              <span className="text-xs font-semibold text-slate-500">Logistics Shipments</span>
              <p className="text-2xl font-bold text-slate-900">{data.deliveryPerformance.total}</p>
              <p className="text-[11px] text-slate-500">{data.deliveryPerformance.delivered} Delivered successfully</p>
            </div>

            <div className="saas-card p-4 space-y-1 border-l-4 border-l-amber-500">
              <span className="text-xs font-semibold text-slate-500">Pending Requests</span>
              <p className="text-2xl font-bold text-slate-900">{data.metrics.pendingRequests}</p>
              <p className="text-[11px] text-slate-500">Awaiting allocation</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Utilization */}
            <div className="saas-panel p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Warehouse Capacity Utilization (%)
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.warehouseUtilization}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="utilization" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volunteer Roster Availability */}
            <div className="saas-panel p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Personnel Availability Status
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.volunteerParticipation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data.volunteerParticipation.map((_, index) => (
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
      )}
    </div>
  );
}
