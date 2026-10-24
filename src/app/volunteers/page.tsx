"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Mail, Phone, MapPin, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { VolunteerAvailability } from "@prisma/client";

interface VolunteerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string;
  availability: VolunteerAvailability;
  location: string;
  status: string;
  assignedDisaster?: { id: string; name: string };
}

export default function VolunteersPage() {
  const { showToast } = useToast();
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [disasters, setDisasters] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "First Aid, Logistics, Medical Triage",
    availability: "Available",
    location: "City Headquarters",
    assignedDisasterId: "",
  });

  const fetchVolunteers = async () => {
    try {
      const [volRes, disRes] = await Promise.all([
        fetch("/api/volunteers"),
        fetch("/api/disasters"),
      ]);

      if (volRes.ok) {
        const data = await volRes.json();
        setVolunteers(data.volunteers || []);
      }
      if (disRes.ok) {
        const data = await disRes.json();
        setDisasters(data.disasters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchVolunteers();
        showToast("Volunteer registered successfully", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Registration failed", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.skills.toLowerCase().includes(search.toLowerCase());
    const matchesAvail = availFilter ? v.availability === availFilter : true;
    return matchesSearch && matchesAvail;
  });

  const availBadge: Record<VolunteerAvailability, string> = {
    Available: "badge-success",
    Deployed: "badge-info",
    On_Leave: "badge-neutral",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Volunteers Roster & Field Response Personnel</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate emergency volunteer personnel, track skill sets, and assign teams to active disaster zones.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Volunteer</span>
        </button>
      </div>

      {/* Controls */}
      <div className="saas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or skill..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Availability</option>
          {Object.values(VolunteerAvailability).map((a) => (
            <option key={a} value={a}>{a.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Roster Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading volunteer roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVolunteers.map((vol) => (
            <div key={vol.id} className="saas-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{vol.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {vol.location}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${availBadge[vol.availability]}`}>
                    {vol.availability}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-700">Specialized Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vol.skills.split(",").map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px]">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {vol.assignedDisaster && (
                  <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-500">Incident: </span>
                    <span className="font-bold text-slate-900">{vol.assignedDisaster.name}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-600">
                <p>Email: <span className="text-slate-900 font-semibold">{vol.email}</span></p>
                <p>Phone: <span className="text-slate-900 font-semibold">{vol.phone}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Register Volunteer
            </h3>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Phone</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Skills (comma separated)</label>
                <input
                  type="text"
                  required
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Base Location</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Assign to Disaster Incident</label>
                <select
                  value={form.assignedDisasterId}
                  onChange={(e) => setForm({ ...form, assignedDisasterId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">General Reserve (No incident assigned)</option>
                  {disasters.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                  Register Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
