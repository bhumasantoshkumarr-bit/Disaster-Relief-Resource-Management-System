"use client";

import { useState, useEffect } from "react";
import { Home, Plus, Search, MapPin, Phone, Hospital, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { CenterType, EmergencyLevel } from "@prisma/client";

interface ReliefCenterItem {
  id: string;
  name: string;
  type: CenterType;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentPopulation: number;
  contactPerson: string;
  phone: string;
  emergencyLevel: EmergencyLevel;
  _count: { requests: number; deliveriesTo: number };
}

export default function CampsPage() {
  const { showToast } = useToast();
  const [centers, setCenters] = useState<ReliefCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Relief_Camp",
    address: "",
    city: "",
    state: "",
    latitude: 9.9312,
    longitude: 76.2673,
    capacity: 500,
    currentPopulation: 100,
    contactPerson: "",
    phone: "",
    emergencyLevel: "Normal",
  });

  const fetchCenters = async () => {
    try {
      const res = await fetch("/api/relief-centers");
      if (res.ok) {
        const data = await res.json();
        setCenters(data.centers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/relief-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          currentPopulation: Number(formData.currentPopulation),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCenters();
        showToast("Relief facility registered", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create center", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCenters = centers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const emergencyBadge: Record<EmergencyLevel, string> = {
    Normal: "badge-success",
    High: "badge-warning",
    Critical: "badge-critical",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600" />
            <span>Relief Camps & Emergency Hospitals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor evacuee occupancy levels, emergency response status, and destination health centers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Facility</span>
        </button>
      </div>

      {/* Controls */}
      <div className="saas-card p-4 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search camp or hospital name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading relief centers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCenters.map((center) => {
            const occupancyPct = Math.min(100, Math.round((center.currentPopulation / center.capacity) * 100));

            return (
              <div key={center.id} className="saas-card p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-neutral uppercase">
                      {center.type.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emergencyBadge[center.emergencyLevel]}`}>
                      {center.emergencyLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{center.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {center.city}, {center.state}
                    </p>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Occupancy Utilization</span>
                      <span className="font-bold text-slate-900">
                        {center.currentPopulation.toLocaleString()} / {center.capacity.toLocaleString()} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          occupancyPct > 90 ? "bg-rose-500" : occupancyPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Contact Person:</span>
                    <span className="font-semibold text-slate-900">{center.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone:</span>
                    <span className="font-semibold text-slate-900">{center.phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Register Relief Camp or Emergency Hospital
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Facility Name</label>
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
                  <label className="text-slate-700 font-semibold">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(CenterType).map((t) => (
                      <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Emergency Level</label>
                  <select
                    value={formData.emergencyLevel}
                    onChange={(e) => setFormData({ ...formData, emergencyLevel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {Object.values(EmergencyLevel).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Capacity</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Current Population</label>
                  <input
                    type="number"
                    required
                    value={formData.currentPopulation}
                    onChange={(e) => setFormData({ ...formData, currentPopulation: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
