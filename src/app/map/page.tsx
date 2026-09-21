"use client";

import { useState, useEffect } from "react";
import DisasterMap from "@/components/map/DisasterMap";
import { MapPin, Layers, Filter } from "lucide-react";

export default function OperationalMapPage() {
  const [disasters, setDisasters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [reliefCenters, setReliefCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDisasters, setShowDisasters] = useState(true);
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [showCenters, setShowCenters] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/disasters"),
      fetch("/api/warehouses"),
      fetch("/api/relief-centers"),
    ])
      .then(async ([dRes, wRes, cRes]) => {
        if (dRes.ok) setDisasters((await dRes.json()).disasters || []);
        if (wRes.ok) setWarehouses((await wRes.json()).warehouses || []);
        if (cRes.ok) setReliefCenters((await cRes.json()).centers || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>Full-Screen Operational Situation Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of active hazards, logistics hubs, and relief shelters.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3 text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Layers:
          </span>
          <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showDisasters}
              onChange={(e) => setShowDisasters(e.target.checked)}
              className="rounded border-slate-300 text-rose-600"
            />
            <span className="text-rose-600">Disasters ({disasters.length})</span>
          </label>
          <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showWarehouses}
              onChange={(e) => setShowWarehouses(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <span className="text-blue-600">Warehouses ({warehouses.length})</span>
          </label>
          <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showCenters}
              onChange={(e) => setShowCenters(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600"
            />
            <span className="text-emerald-600">Camps ({reliefCenters.length})</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading operational map...</div>
      ) : (
        <div className="saas-panel p-2 rounded-xl overflow-hidden shadow-md">
          <DisasterMap
            disasters={showDisasters ? disasters : []}
            warehouses={showWarehouses ? warehouses : []}
            reliefCenters={showCenters ? reliefCenters : []}
          />
        </div>
      )}
    </div>
  );
}
