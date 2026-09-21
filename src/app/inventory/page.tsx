"use client";

import { useState, useEffect } from "react";
import { Boxes, Warehouse, Plus, Search, Package, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ResourceCategory, ResourceStatus } from "@prisma/client";

interface WarehouseItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  contactPerson: string;
  phone: string;
  currentUtilization: number;
  _count: { resources: number };
}

interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  unit: string;
  quantity: number;
  minStockLevel: number;
  status: ResourceStatus;
  warehouseId: string;
  warehouse: { id: string; name: string; city: string };
}

export default function InventoryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"resources" | "warehouses">("resources");
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Form State
  const [resourceForm, setResourceForm] = useState({
    name: "",
    category: "Food",
    unit: "kits",
    quantity: 100,
    minStockLevel: 20,
    warehouseId: "",
  });

  const fetchData = async () => {
    try {
      const [whRes, resRes] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/resources"),
      ]);

      if (whRes.ok) {
        const data = await whRes.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0 && !resourceForm.warehouseId) {
          setResourceForm((prev) => ({ ...prev, warehouseId: data.warehouses[0].id }));
        }
      }
      if (resRes.ok) {
        const data = await resRes.json();
        setResources(data.resources || []);
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

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...resourceForm,
          quantity: Number(resourceForm.quantity),
          minStockLevel: Number(resourceForm.minStockLevel),
        }),
      });

      if (res.ok) {
        setShowResourceModal(false);
        fetchData();
        showToast("Resource added to warehouse inventory", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add resource", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    try {
      const res = await fetch("/api/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity: newQty }),
      });
      if (res.ok) {
        fetchData();
        showToast(`Stock updated to ${newQty}`, "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? r.category === categoryFilter : true;
    const matchesWarehouse = warehouseFilter ? r.warehouseId === warehouseFilter : true;
    const matchesLowStock = lowStockOnly ? r.quantity <= r.minStockLevel : true;
    return matchesSearch && matchesCategory && matchesWarehouse && matchesLowStock;
  });

  const statusBadge: Record<ResourceStatus, { label: string; class: string }> = {
    Available: { label: "Available", class: "badge-success" },
    Low_Stock: { label: "Low Stock", class: "badge-warning" },
    Out_of_Stock: { label: "Out of Stock", class: "badge-critical" },
    Expired: { label: "Expired", class: "badge-neutral" },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <span>Resource Inventory & Warehouse Supply Hubs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized inventory database tracking stock availability, warehouse utilization, and min threshold warnings.
          </p>
        </div>

        <button
          onClick={() => setShowResourceModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "resources"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Resource Inventory ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("warehouses")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "warehouses"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Warehouse Facilities ({warehouses.length})</span>
        </button>
      </div>

      {/* Resource Inventory View */}
      {activeTab === "resources" ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="saas-card p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resource name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                <option value="">All Categories</option>
                {Object.values(ResourceCategory).map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Low Stock Only</span>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading inventory records...</div>
          ) : (
            <div className="saas-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Resource Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Warehouse Hub</th>
                      <th className="px-4 py-3">Available Quantity</th>
                      <th className="px-4 py-3">Min Level</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Stock Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredResources.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.category.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-indigo-600 font-medium">{item.warehouse.name} ({item.warehouse.city})</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {item.quantity.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.minStockLevel} {item.unit}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge[item.status].class}`}>
                            {statusBadge[item.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded p-0.5">
                            <button
                              onClick={() => handleUpdateStock(item.id, item.quantity, -10)}
                              className="px-2 py-0.5 text-xs text-rose-600 hover:bg-white rounded font-bold"
                              title="Deduct 10"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => handleUpdateStock(item.id, item.quantity, 10)}
                              className="px-2 py-0.5 text-xs text-emerald-600 hover:bg-white rounded font-bold"
                              title="Add 10"
                            >
                              +10
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
        </div>
      ) : (
        /* Warehouses View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => (
            <div key={wh.id} className="saas-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                    <p className="text-xs text-slate-500">{wh.city}, {wh.state}</p>
                  </div>
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Capacity Utilization</span>
                    <span className="font-bold text-slate-900">{wh.currentUtilization}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        wh.currentUtilization > 80 ? "bg-rose-500" : wh.currentUtilization > 50 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${wh.currentUtilization}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-600">
                <p>Capacity: <span className="text-slate-900 font-semibold">{wh.capacity} units</span></p>
                <p>Contact: <span className="text-slate-900 font-semibold">{wh.contactPerson} ({wh.phone})</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Add Item to Resource Inventory
            </h3>

            <form onSubmit={handleAddResource} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Resource Item Name</label>
                <input
                  type="text"
                  required
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  placeholder="e.g. Drinking Water Cans 20L"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Category</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(ResourceCategory).map((c) => (
                      <option key={c} value={c}>{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Unit (e.g. cans, kits)</label>
                  <input
                    type="text"
                    required
                    value={resourceForm.unit}
                    onChange={(e) => setResourceForm({ ...resourceForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Initial Quantity</label>
                  <input
                    type="number"
                    required
                    value={resourceForm.quantity}
                    onChange={(e) => setResourceForm({ ...resourceForm, quantity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Min Warning Threshold</label>
                  <input
                    type="number"
                    required
                    value={resourceForm.minStockLevel}
                    onChange={(e) => setResourceForm({ ...resourceForm, minStockLevel: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Warehouse Hub</label>
                <select
                  value={resourceForm.warehouseId}
                  onChange={(e) => setResourceForm({ ...resourceForm, warehouseId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
