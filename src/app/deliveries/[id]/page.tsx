"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  Warehouse,
  Home,
  ArrowRight,
  Activity,
} from "lucide-react";
import DisasterMap from "@/components/map/DisasterMap";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface DeliveryDetail {
  id: string;
  assignedVehicle: string;
  driverName: string;
  driverPhone: string;
  status: string;
  departureTime?: string | null;
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  trackingNotes?: string | null;
  createdAt: string;
  sourceWarehouse: {
    id: string;
    name: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentUtilization: number;
  };
  destinationCenter: {
    id: string;
    name: string;
    type: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    currentPopulation: number;
    emergencyLevel: string;
  };
  request: {
    id: string;
    priority: string;
    status: string;
    disaster: { id: string; name: string; severity: string };
    requester: { name: string; email: string };
  };
  items: Array<{
    id: string;
    quantity: number;
    resource: {
      id: string;
      name: string;
      unit: string;
      category: string;
    };
  }>;
}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesInput, setNotesInput] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`/api/deliveries/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setDelivery(data.delivery);
        setNotesInput(data.delivery.trackingNotes || "");
      } else {
        showToast("Shipment record not found", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading delivery details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [resolvedParams.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!delivery) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/deliveries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: delivery.id,
          status: newStatus,
          trackingNotes: notesInput,
        }),
      });

      if (res.ok) {
        showToast(`Delivery status updated to ${newStatus.replace("_", " ")}`, "success");
        fetchDelivery();
      } else {
        const err = await res.json();
        showToast(err.error || "Update failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error updating delivery", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="saas-card p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Shipment Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested delivery shipment could not be located.</p>
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deliveries
        </Link>
      </div>
    );
  }

  const pipelineStages = ["Pending", "Dispatched", "In_Transit", "Delivered"];
  const currentStageIdx = pipelineStages.indexOf(delivery.status);

  const statusBadge: Record<string, string> = {
    Pending: "badge-warning",
    Dispatched: "badge-info",
    In_Transit: "badge-info",
    Delivered: "badge-success",
    Delayed: "badge-critical",
    Cancelled: "badge-neutral",
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            href="/deliveries"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Deliveries</span>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" />
              <span>Shipment: {delivery.assignedVehicle}</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${statusBadge[delivery.status] || "badge-neutral"}`}>
              {delivery.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Operational Transition Action Buttons */}
        <div className="flex items-center gap-2">
          {delivery.status === "Pending" && (
            <button
              onClick={() => handleUpdateStatus("Dispatched")}
              disabled={updating}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>Mark Dispatched</span>
            </button>
          )}

          {delivery.status === "Dispatched" && (
            <button
              onClick={() => handleUpdateStatus("In_Transit")}
              disabled={updating}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              <span>Mark In Transit</span>
            </button>
          )}

          {delivery.status === "In_Transit" && (
            <button
              onClick={() => handleUpdateStatus("Delivered")}
              disabled={updating}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Delivered</span>
            </button>
          )}

          {delivery.status === "Delivered" && (
            <span className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivery Completed & Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Shipment Status Progression Stepper */}
      <div className="saas-card p-5 space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics Pipeline Status</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {pipelineStages.map((stage, idx) => {
            const isPassed = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;

            return (
              <div
                key={stage}
                className={`p-3 rounded-lg border ${
                  isCurrent
                    ? "bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-200"
                    : isPassed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>{idx + 1}. {stage.replace("_", " ")}</span>
                  {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-slate-500">
                  {stage === "Pending"
                    ? "Created"
                    : stage === "Dispatched" && delivery.departureTime
                    ? new Date(delivery.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : stage === "Delivered" && delivery.actualArrival
                    ? new Date(delivery.actualArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : isPassed
                    ? "Completed"
                    : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column: Route Details & Driver Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Details Card */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Route Transit Corridor</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-3">
              <Warehouse className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase">Origin Source Hub</span>
                <p className="font-bold text-slate-900 text-sm">{delivery.sourceWarehouse.name}</p>
                <p className="text-slate-600 text-[11px]">{delivery.sourceWarehouse.address}, {delivery.sourceWarehouse.city}</p>
              </div>
            </div>

            <div className="flex justify-center text-indigo-600">
              <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-start gap-3">
              <Home className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Destination Relief Center</span>
                <p className="font-bold text-slate-900 text-sm">{delivery.destinationCenter.name}</p>
                <p className="text-slate-600 text-[11px]">{delivery.destinationCenter.address}, {delivery.destinationCenter.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Convoy Details Card */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Convoy Driver & Vehicle Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lead Driver</span>
              <p className="font-bold text-slate-900 text-sm">{delivery.driverName}</p>
              <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{delivery.driverPhone}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Vehicle</span>
              <p className="font-bold text-slate-900 text-sm">{delivery.assignedVehicle}</p>
              <p className="text-slate-500 text-[11px]">Cargo Transport Unit</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Linked Requisition</span>
              <Link href={`/requests/${delivery.request.id}`} className="font-bold text-indigo-600 hover:underline block truncate text-sm">
                REQ-{delivery.request.id.slice(0, 8)}
              </Link>
              <p className="text-slate-500 text-[11px]">Priority: {delivery.request.priority}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Target Incident</span>
              <p className="font-bold text-slate-900 truncate text-sm">{delivery.request.disaster.name}</p>
              <p className="text-slate-500 text-[11px]">Severity: {delivery.request.disaster.severity}</p>
            </div>
          </div>

          {/* Tracking Notes Editor */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-700">Dispatch Log & Status Notes</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Add convoy route update or checkpoint report..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleUpdateStatus(delivery.status)}
                disabled={updating}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Geospatial Map Section */}
      <div className="saas-panel p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Geospatial Transit Corridor</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Origin: {delivery.sourceWarehouse.city} → Destination: {delivery.destinationCenter.city}
          </span>
        </div>
        <DisasterMap
          warehouses={[delivery.sourceWarehouse]}
          reliefCenters={[delivery.destinationCenter]}
        />
      </div>

      {/* Cargo Items Manifest Table */}
      {delivery.items && delivery.items.length > 0 && (
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cargo Manifest & Freight Inventory ({delivery.items.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resource Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Manifest Quantity</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {delivery.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.resource.name}</td>
                    <td className="px-4 py-3 text-indigo-600 font-semibold">{item.resource.category.replace("_", " ")}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-500">{item.resource.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
