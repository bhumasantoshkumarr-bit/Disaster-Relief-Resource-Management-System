"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Boxes,
  Truck,
  Plus,
  Warehouse,
  Home,
  User,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface RequestDetail {
  id: string;
  priority: string;
  justification: string;
  status: string;
  requestedDate: string;
  approvedDate?: string | null;
  fulfilledDate?: string | null;
  requester: { id: string; name: string; email: string; role: string };
  disaster: { id: string; name: string; severity: string; affectedArea: string };
  destinationCenter: { id: string; name: string; city: string; address: string; emergencyLevel: string };
  items: Array<{
    id: string;
    category: string;
    requestedQuantity: number;
    fulfilledQuantity: number;
    resource?: {
      id: string;
      name: string;
      unit: string;
      quantity: number;
      warehouse: { id: string; name: string; city: string };
    } | null;
  }>;
  allocations: Array<{
    id: string;
    allocatedQuantity: number;
    allocatedAt: string;
    status: string;
    notes?: string | null;
    allocatedBy: { name: string; email: string };
    resource: {
      id: string;
      name: string;
      unit: string;
      warehouse: { id: string; name: string; city: string };
    };
  }>;
  deliveries: Array<{
    id: string;
    assignedVehicle: string;
    driverName: string;
    driverPhone: string;
    status: string;
    departureTime?: string | null;
    actualArrival?: string | null;
    trackingNotes?: string | null;
    sourceWarehouse: { name: string; city: string };
  }>;
}

interface WarehouseResource {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  warehouse: { id: string; name: string; city: string };
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [resources, setResources] = useState<WarehouseResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Allocation Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    resourceId: "",
    allocatedQuantity: 50,
    notes: "Allocated via Operations Center dispatch",
  });
  const [submittingAllocate, setSubmittingAllocate] = useState(false);

  // Delivery Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    sourceWarehouseId: "",
    assignedVehicle: "Convoy Van (KL-07-EX-2020)",
    driverName: "Sanjay Verma",
    driverPhone: "+91 98888 22334",
    trackingNotes: "Priority emergency convoy departure",
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
      } else {
        showToast("Requisition not found", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading request details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
        if (data.resources?.length > 0 && !allocationForm.resourceId) {
          setAllocationForm((prev) => ({ ...prev, resourceId: data.resources[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequest();
    fetchResources();
  }, [resolvedParams.id]);

  const handleStatusUpdate = async (status: string) => {
    if (!request) return;
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status }),
      });

      if (res.ok) {
        showToast(`Request status updated to ${status}`, "success");
        fetchRequest();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error updating status", "error");
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setSubmittingAllocate(true);
    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          resourceId: allocationForm.resourceId,
          allocatedQuantity: Number(allocationForm.allocatedQuantity),
          notes: allocationForm.notes,
        }),
      });

      if (res.ok) {
        showToast("Resources successfully allocated from warehouse inventory", "success");
        setShowAllocateModal(false);
        fetchRequest();
        fetchResources();
      } else {
        const err = await res.json();
        showToast(err.error || "Allocation failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error executing allocation", "error");
    } finally {
      setSubmittingAllocate(false);
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setSubmittingDelivery(true);

    const warehouseId =
      deliveryForm.sourceWarehouseId ||
      request.allocations[0]?.resource.warehouse.id ||
      resources[0]?.warehouse.id;

    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          sourceWarehouseId: warehouseId,
          destinationCenterId: request.destinationCenter.id,
          assignedVehicle: deliveryForm.assignedVehicle,
          driverName: deliveryForm.driverName,
          driverPhone: deliveryForm.driverPhone,
          trackingNotes: deliveryForm.trackingNotes,
        }),
      });

      if (res.ok) {
        showToast("Delivery shipment created & dispatched", "success");
        setShowDeliveryModal(false);
        fetchRequest();
      } else {
        const err = await res.json();
        showToast(err.error || "Delivery creation failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating delivery", "error");
    } finally {
      setSubmittingDelivery(false);
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

  if (!request) {
    return (
      <div className="saas-card p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Requisition Not Found</h2>
        <p className="text-xs text-slate-500">The requested resource requisition could not be located.</p>
        <Link
          href="/requests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requisitions
        </Link>
      </div>
    );
  }

  const priorityBadge: Record<string, string> = {
    Critical: "badge-critical",
    High: "badge-high",
    Medium: "badge-warning",
    Low: "badge-success",
  };

  const statusBadge: Record<string, string> = {
    Pending: "badge-warning",
    Under_Review: "badge-info",
    Approved: "badge-info",
    Partially_Fulfilled: "badge-warning",
    Fulfilled: "badge-success",
    Rejected: "badge-critical",
    Cancelled: "badge-neutral",
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            href="/requests"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Requisitions</span>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-indigo-600" />
              <span>Requisition #{request.id.slice(0, 8)}</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${priorityBadge[request.priority] || "badge-warning"}`}>
              {request.priority}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${statusBadge[request.status] || "badge-neutral"}`}>
              {request.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {request.status === "Pending" && (
            <>
              <button
                onClick={() => handleStatusUpdate("Approved")}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Requisition</span>
              </button>
              <button
                onClick={() => handleStatusUpdate("Rejected")}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          )}

          {request.status !== "Fulfilled" && request.status !== "Cancelled" && request.status !== "Rejected" && (
            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Boxes className="w-4 h-4" />
              <span>Allocate Inventory</span>
            </button>
          )}

          {request.allocations.length > 0 && request.status !== "Fulfilled" && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch Delivery</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1 border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500">Destination Relief Center</span>
          <p className="text-sm font-bold text-slate-900 truncate">{request.destinationCenter.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{request.destinationCenter.city}</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-500">Target Disaster</span>
          <p className="text-sm font-bold text-slate-900 truncate">{request.disaster.name}</p>
          <p className="text-[11px] text-slate-500">Severity: {request.disaster.severity}</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500">Requester</span>
          <p className="text-sm font-bold text-slate-900 truncate">{request.requester.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{request.requester.role.replace("_", " ")}</p>
        </div>

        <div className="saas-card p-4 space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500">Requested On</span>
          <p className="text-sm font-bold text-slate-900 truncate">
            {new Date(request.requestedDate).toLocaleDateString()}
          </p>
          <p className="text-[11px] text-slate-500">
            {request.approvedDate ? `Approved: ${new Date(request.approvedDate).toLocaleDateString()}` : "Awaiting approval"}
          </p>
        </div>
      </div>

      {/* Justification Box */}
      <div className="saas-card p-5 space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Requisition Justification</h3>
        <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 leading-relaxed">
          {request.justification}
        </p>
      </div>

      {/* Requested Items Table */}
      <div className="saas-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Requisitioned Items Manifest ({request.items.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Matched Catalog Item</th>
                <th className="px-4 py-3">Requested Qty</th>
                <th className="px-4 py-3">Fulfilled Qty</th>
                <th className="px-4 py-3">Fulfillment Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {request.items.map((item) => {
                const percent = Math.min(100, Math.round((item.fulfilledQuantity / item.requestedQuantity) * 100));
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.category.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.resource ? (
                        <span>
                          {item.resource.name} ({item.resource.warehouse?.name})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Auto-allocated during dispatch</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.requestedQuantity}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{item.fulfilledQuantity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : percent > 0 ? "bg-indigo-600" : "bg-slate-300"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 w-9 text-right">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Split: Allocations & Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocations Made */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Warehouse Stock Allocations ({request.allocations.length})
              </h3>
            </div>
          </div>

          {request.allocations.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">No inventory allocations recorded for this request yet.</p>
          ) : (
            <div className="space-y-3">
              {request.allocations.map((alloc) => (
                <div key={alloc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{alloc.resource.name}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{alloc.allocatedQuantity} {alloc.resource.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>From: <strong>{alloc.resource.warehouse.name}</strong></span>
                    <span>By: {alloc.allocatedBy.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliveries Created */}
        <div className="saas-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supply Shipments ({request.deliveries.length})
              </h3>
            </div>
            <Link href="/deliveries" className="text-xs font-semibold text-indigo-600 hover:underline">
              Logistics →
            </Link>
          </div>

          {request.deliveries.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">No delivery convoys dispatched for this request yet.</p>
          ) : (
            <div className="space-y-3">
              {request.deliveries.map((del) => (
                <div key={del.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{del.assignedVehicle}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      del.status === "Delivered" ? "badge-success" : "badge-info"
                    }`}>
                      {del.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Driver: <strong>{del.driverName}</strong> ({del.driverPhone})</span>
                    <Link href={`/deliveries/${del.id}`} className="text-indigo-600 font-semibold hover:underline">
                      Tracking →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Allocate Inventory to Requisition</h3>
            <p className="text-xs text-slate-500">
              Select stock from available warehouses. Inventory will be atomically reserved and deducted.
            </p>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Available Resource</label>
                <select
                  value={allocationForm.resourceId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, resourceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                >
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} — {res.quantity} {res.unit} available ({res.warehouse.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Allocation Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={allocationForm.allocatedQuantity}
                  onChange={(e) => setAllocationForm({ ...allocationForm, allocatedQuantity: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Operational Dispatch Notes</label>
                <input
                  type="text"
                  value={allocationForm.notes}
                  onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAllocate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingAllocate ? "Allocating..." : "Confirm Stock Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Dispatch Logistics Convoy</h3>
            <p className="text-xs text-slate-500">
              Create a transport shipment manifest from warehouse to {request.destinationCenter.name}.
            </p>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Vehicle / Convoy Identifier</label>
                <input
                  type="text"
                  value={deliveryForm.assignedVehicle}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, assignedVehicle: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Driver Name</label>
                  <input
                    type="text"
                    value={deliveryForm.driverName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, driverName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Driver Phone</label>
                  <input
                    type="text"
                    value={deliveryForm.driverPhone}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, driverPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Convoy Notes</label>
                <input
                  type="text"
                  value={deliveryForm.trackingNotes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNotes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingDelivery ? "Dispatching..." : "Dispatch Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
