"use client";

import { useState, useEffect } from "react";
import { Flame, Plus, AlertCircle, MapPin, Users, Calendar, Search, Edit2, Trash2, X, Eye } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { DisasterType, SeverityLevel, DisasterStatus } from "@prisma/client";

interface DisasterItem {
  id: string;
  name: string;
  type: DisasterType;
  description: string;
  severity: SeverityLevel;
  status: DisasterStatus;
  affectedArea: string;
  latitude: number;
  longitude: number;
  estimatedPopulation: number;
  startDate: string;
  createdBy: { name: string; email: string };
  _count: { requests: number; volunteers: number; tasks: number };
}

export default function DisastersPage() {
  const { showToast } = useToast();
  const [disasters, setDisasters] = useState<DisasterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDisaster, setEditingDisaster] = useState<DisasterItem | null>(null);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "Flood",
    description: "",
    severity: "High",
    status: "Active",
    affectedArea: "",
    latitude: 9.9312,
    longitude: 76.2673,
    estimatedPopulation: 10000,
    startDate: new Date().toISOString().split("T")[0],
  });

  const fetchDisasters = async () => {
    try {
      const res = await fetch("/api/disasters");
      if (res.ok) {
        const data = await res.json();
        setDisasters(data.disasters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingDisaster;
    const url = "/api/disasters";
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit ? { ...formData, id: editingDisaster.id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          estimatedPopulation: Number(formData.estimatedPopulation),
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setEditingDisaster(null);
        fetchDisasters();
        showToast(isEdit ? "Disaster updated successfully" : "Disaster incident registered", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Operation failed", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/disasters?id=${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        setDeletingId(null);
        fetchDisasters();
        showToast("Disaster record deleted", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Delete failed", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (d: DisasterItem) => {
    setEditingDisaster(d);
    setFormData({
      name: d.name,
      type: d.type,
      description: d.description,
      severity: d.severity,
      status: d.status,
      affectedArea: d.affectedArea,
      latitude: d.latitude,
      longitude: d.longitude,
      estimatedPopulation: d.estimatedPopulation,
      startDate: new Date(d.startDate).toISOString().split("T")[0],
    });
    setShowCreateModal(true);
  };

  const filteredDisasters = disasters.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.affectedArea.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter ? d.severity === severityFilter : true;
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <span>Disaster Incidents Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, register, and coordinate disaster response incidents across region hazard zones.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDisaster(null);
            setFormData({
              name: "",
              type: "Flood",
              description: "",
              severity: "High",
              status: "Active",
              affectedArea: "",
              latitude: 9.9312,
              longitude: 76.2673,
              estimatedPopulation: 10000,
              startDate: new Date().toISOString().split("T")[0],
            });
            setShowCreateModal(true);
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Disaster</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="saas-card p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or district..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Severities</option>
            {Object.values(SeverityLevel).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            {Object.values(DisasterStatus).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Disasters Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading disaster incidents...</div>
      ) : filteredDisasters.length === 0 ? (
        <div className="saas-card p-8 text-center text-slate-500 text-xs">
          No disaster incidents found matching filters.
        </div>
      ) : (
        <div className="saas-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Disaster Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Affected Location</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Est. Population</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDisasters.map((disaster) => (
                  <tr key={disaster.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{disaster.name}</td>
                    <td className="px-4 py-3 text-indigo-600 font-semibold">{disaster.type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-slate-600">{disaster.affectedArea}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        disaster.severity === "Critical" ? "badge-critical" : disaster.severity === "High" ? "badge-high" : "badge-warning"
                      }`}>
                        {disaster.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{disaster.estimatedPopulation.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-neutral">
                        {disaster.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedDisaster(disaster)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(disaster)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(disaster.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDisaster ? "Edit Disaster Record" : "Register New Disaster Incident"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Incident Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Disaster Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(DisasterType).map((t) => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(SeverityLevel).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Affected Area / District</label>
                  <input
                    type="text"
                    required
                    value={formData.affectedArea}
                    onChange={(e) => setFormData({ ...formData, affectedArea: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Est. Population</label>
                  <input
                    type="number"
                    required
                    value={formData.estimatedPopulation}
                    onChange={(e) => setFormData({ ...formData, estimatedPopulation: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
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
                  Save Incident Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disaster Detail Drawer */}
      {selectedDisaster && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 space-y-5 shadow-2xl overflow-y-auto border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-critical uppercase">
                  {selectedDisaster.severity} Severity
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedDisaster.name}</h3>
              </div>
              <button onClick={() => setSelectedDisaster(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Incident Description</p>
                <p className="text-slate-600">{selectedDisaster.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Affected Location</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedDisaster.affectedArea}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Population</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedDisaster.estimatedPopulation.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Coordinates</p>
                <p className="text-slate-600">Lat: {selectedDisaster.latitude}, Long: {selectedDisaster.longitude}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedDisaster(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Disaster Incident?"
        message="Are you sure you want to remove this disaster record? All related request allocations may be unlinked."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
