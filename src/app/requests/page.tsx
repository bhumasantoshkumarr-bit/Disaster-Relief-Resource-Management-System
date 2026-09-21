"use client";

import { useState, useEffect } from "react";
import { FileCheck, Plus, CheckCircle2, Clock, AlertTriangle, Boxes, Search, ChevronRight, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { RequestPriority, RequestStatus, ResourceCategory } from "@prisma/client";

interface RequestItemData {
  id: string;
  category: ResourceCategory;
  requestedQuantity: number;
  fulfilledQuantity: number;
  resource?: { name: string; unit: string; quantity: number };
}

interface RequestRecord {
  id: string;
  priority: RequestPriority;
  justification: string;
  status: RequestStatus;
  requestedDate: string;
  approvedDate?: string;
  requester: { name: string; email: string };
  disasterId: string;
  disaster: { id: string; name: string };
  destinationCenter: { id: string; name: string; city: string };
  items: RequestItemData[];
}

interface WarehouseResource {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  warehouse: { name: string };
}

export default function RequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [disasters, setDisasters] = useState<Array<{ id: string; name: string }>>([]);
  const [centers, setCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouseResources, setWarehouseResources] = useState<WarehouseResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [disasterFilter, setDisasterFilter] = useState("");

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);

  // Forms
  const [requestForm, setRequestForm] = useState({
    disasterId: "",
    destinationCenterId: "",
    priority: "High",
    justification: "",
    items: [{ category: "Water" as ResourceCategory, requestedQuantity: 100 }],
  });

  const [allocationForm, setAllocationForm] = useState({
    resourceId: "",
    allocatedQuantity: 50,
    notes: "Allocated directly from central warehouse hub.",
  });

  const fetchData = async () => {
    try {
      const [reqRes, disRes, centerRes, stockRes] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/disasters"),
        fetch("/api/relief-centers"),
        fetch("/api/resources"),
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }
      if (disRes.ok) {
        const data = await disRes.json();
        setDisasters(data.disasters || []);
        if (data.disasters?.length > 0 && !requestForm.disasterId) {
          setRequestForm((prev) => ({ ...prev, disasterId: data.disasters[0].id }));
        }
      }
      if (centerRes.ok) {
        const data = await centerRes.json();
        setCenters(data.centers || []);
        if (data.centers?.length > 0 && !requestForm.destinationCenterId) {
          setRequestForm((prev) => ({ ...prev, destinationCenterId: data.centers[0].id }));
        }
      }
      if (stockRes.ok) {
        const data = await stockRes.json();
        setWarehouseResources(data.resources || []);
        if (data.resources?.length > 0) {
          setAllocationForm((prev) => ({ ...prev, resourceId: data.resources[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchData();
        showToast("Requisition submitted successfully", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Submission failed", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchData();
        showToast(`Request status set to ${status}`, "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          resourceId: allocationForm.resourceId,
          allocatedQuantity: Number(allocationForm.allocatedQuantity),
          notes: allocationForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAllocateModal(false);
        fetchData();
        showToast("Stock allocated and inventory deducted safely", "success");
      } else {
        showToast(data.error || "Allocation failed", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.destinationCenter.name.toLowerCase().includes(search.toLowerCase()) ||
      r.justification.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter ? r.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    const matchesDisaster = disasterFilter ? r.disasterId === disasterFilter : true;
    return matchesSearch && matchesPriority && matchesStatus && matchesDisaster;
  });

  const workflowStages = [
    "Submitted",
    "Under Review",
    "Approved",
    "Allocated",
    "Dispatched",
    "Delivered",
    "Fulfilled",
  ];

  const getStageIndex = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return 0;
      case "Under_Review": return 1;
      case "Approved": return 2;
      case "Partially_Fulfilled": return 3;
      case "Fulfilled": return 6;
      default: return 0;
    }
  };

  const priorityBadge: Record<RequestPriority, string> = {
    Critical: "badge-critical",
    High: "badge-high",
    Medium: "badge-warning",
    Low: "badge-success",
  };

  const statusBadge: Record<RequestStatus, string> = {
    Pending: "badge-warning",
    Under_Review: "badge-info",
    Approved: "badge-info",
    Partially_Fulfilled: "badge-warning",
    Fulfilled: "badge-success",
    Rejected: "badge-critical",
    Cancelled: "badge-neutral",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <span>Resource Requisitions & Workflow Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process field resource requests, verify priorities, and execute inventory stock allocations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="saas-card p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by destination or text..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Priorities</option>
            {Object.values(RequestPriority).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            {Object.values(RequestStatus).map((st) => (
              <option key={st} value={st}>{st.replace("_", " ")}</option>
            ))}
          </select>

          <select
            value={disasterFilter}
            onChange={(e) => setDisasterFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Disasters</option>
            {disasters.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading requisitions...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="saas-card p-8 text-center text-slate-500 text-xs">
          No requisitions found matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const currentStageIdx = getStageIndex(req.status);

            return (
              <div key={req.id} className="saas-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">REQ-{req.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge[req.priority]}`}>
                      {req.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge[req.status]}`}>
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  <span className="text-slate-500">
                    Requested by <span className="font-semibold text-slate-900">{req.requester.name}</span> on{" "}
                    {new Date(req.requestedDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Workflow Stepper */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Progression</p>
                  <div className="flex items-center justify-between overflow-x-auto text-[11px]">
                    {workflowStages.map((stage, idx) => {
                      const isPassed = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;

                      return (
                        <div key={stage} className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isCurrent
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className={`font-semibold ${isCurrent ? "text-indigo-700" : isPassed ? "text-slate-900" : "text-slate-400"}`}>
                            {stage}
                          </span>
                          {idx < workflowStages.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-slate-300 mx-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{req.destinationCenter.name}</h4>
                    <p className="text-indigo-600 font-medium">Incident: {req.disaster.name}</p>
                    <p className="text-slate-600 mt-1 bg-white p-2.5 rounded border border-slate-200 italic">
                      "{req.justification}"
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700">Requested Line Items:</span>
                    {req.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800">{item.category.replace("_", " ")}</span>
                        <span className="font-bold text-indigo-600">
                          {item.fulfilledQuantity} / {item.requestedQuantity} fulfilled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View Details →
                  </button>

                  <div className="flex items-center gap-2">
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, "Approved")}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold hover:bg-emerald-100"
                        >
                          Approve Requisition
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, "Rejected")}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(req.status === "Pending" || req.status === "Approved") && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowAllocateModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Allocate Stock</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Submit Supply Requisition
            </h3>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Disaster Incident</label>
                <select
                  value={requestForm.disasterId}
                  onChange={(e) => setRequestForm({ ...requestForm, disasterId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {disasters.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Destination Relief Camp / Hospital</label>
                <select
                  value={requestForm.destinationCenterId}
                  onChange={(e) => setRequestForm({ ...requestForm, destinationCenterId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Priority</label>
                <select
                  value={requestForm.priority}
                  onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {Object.values(RequestPriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Category & Quantity</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={requestForm.items[0].category}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        items: [{ ...requestForm.items[0], category: e.target.value as ResourceCategory }],
                      })
                    }
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(ResourceCategory).map((cat) => (
                      <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    value={requestForm.items[0].requestedQuantity}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        items: [{ ...requestForm.items[0], requestedQuantity: Number(e.target.value) }],
                      })
                    }
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Justification</label>
                <textarea
                  required
                  rows={3}
                  value={requestForm.justification}
                  onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Allocation Modal */}
      {showAllocateModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Allocate Stock from Warehouse
            </h3>

            <form onSubmit={handleAllocateSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900">{selectedRequest.destinationCenter.name}</p>
                <p className="text-slate-500 text-[11px]">Disaster: {selectedRequest.disaster.name}</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Select Warehouse Stock Resource</label>
                <select
                  value={allocationForm.resourceId}
                  onChange={(e) => setAllocationForm({ ...allocationForm, resourceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {warehouseResources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} — Avail: {res.quantity} {res.unit} ({res.warehouse.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Quantity to Allocate</label>
                <input
                  type="number"
                  required
                  value={allocationForm.allocatedQuantity}
                  onChange={(e) => setAllocationForm({ ...allocationForm, allocatedQuantity: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Execute Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
