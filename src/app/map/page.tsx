"use client";

import { useState, useEffect } from "react";
import DisasterMap from "@/components/map/DisasterMap";
import { MapPin, Layers, Flame, Warehouse, Home, Truck, Shield } from "lucide-react";

export default function OperationalMapPage() {
  const [disasters, setDisasters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [reliefCenters, setReliefCenters] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDisasters, setShowDisasters] = useState(true);
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showDeliveries, setShowDeliveries] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/disasters"),
      fetch("/api/warehouses"),
      fetch("/api/relief-centers"),
      fetch("/api/deliveries"),
    ])
      .then(async ([dRes, wRes, cRes, delRes]) => {
        if (dRes.ok) setDisasters((await dRes.json()).disasters || []);
        if (wRes.ok) setWarehouses((await wRes.json()).warehouses || []);
        if (cRes.ok) setReliefCenters((await cRes.json()).centers || []);
        if (delRes.ok) setDeliveries((await delRes.json()).deliveries || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>Full-Screen Operational Geospatial Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of active emergency hazards, supply warehouses, relief shelters, and active transit convoys.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Layers:
          </span>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showDisasters}
              onChange={(e) => setShowDisasters(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Incidents ({disasters.length})
            </span>
          </label>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showWarehouses}
              onChange={(e) => setShowWarehouses(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Warehouses ({warehouses.length})
            </span>
          </label>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showCenters}
              onChange={(e) => setShowCenters(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Relief Shelters ({reliefCenters.length})
            </span>
          </label>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeliveries}
              onChange={(e) => setShowDeliveries(e.target.checked)}
              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="flex items-center gap-1 text-orange-600">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Convoys ({deliveries.length})
            </span>
          </label>
        </div>
      </div>

      {/* Map Container */}
      {loading ? (
        <div className="h-[550px] w-full bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading geospatial cartography...</p>
          </div>
        </div>
      ) : (
        <div className="saas-panel p-2 rounded-xl overflow-hidden shadow-md">
          <DisasterMap
            disasters={showDisasters ? disasters : []}
            warehouses={showWarehouses ? warehouses : []}
            reliefCenters={showCenters ? reliefCenters : []}
            deliveries={showDeliveries ? deliveries : []}
            height="580px"
          />
        </div>
      )}

      {/* Quick Status Legend Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="saas-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Emergency Incidents</p>
            <p className="font-bold text-slate-900">{disasters.length} Recorded</p>
          </div>
        </div>

        <div className="saas-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Logistics Depots</p>
            <p className="font-bold text-slate-900">{warehouses.length} Active Hubs</p>
          </div>
        </div>

        <div className="saas-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Shelters & Hospitals</p>
            <p className="font-bold text-slate-900">{reliefCenters.length} Facilities</p>
          </div>
        </div>

        <div className="saas-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Active Shipments</p>
            <p className="font-bold text-slate-900">{deliveries.length} Convoys</p>
          </div>
        </div>
      </div>
    </div>
  );
}
