"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet icon issue in Webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const blueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const orangeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export const isValidCoord = (lat?: number | null, lng?: number | null): boolean => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

interface DisasterMapProps {
  disasters?: Array<{
    id: string;
    name: string;
    type: string;
    severity: string;
    affectedArea: string;
    latitude: number;
    longitude: number;
    estimatedPopulation: number;
  }>;
  warehouses?: Array<{
    id: string;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    capacity: number;
    currentUtilization: number;
  }>;
  reliefCenters?: Array<{
    id: string;
    name: string;
    type: string;
    city: string;
    latitude: number;
    longitude: number;
    currentPopulation: number;
    emergencyLevel: string;
  }>;
  deliveries?: Array<{
    id: string;
    assignedVehicle: string;
    driverName: string;
    status: string;
    sourceWarehouse?: { name: string; city?: string; latitude: number; longitude: number };
    destinationCenter?: { name: string; city?: string; latitude: number; longitude: number };
  }>;
  height?: string;
}

export default function DisasterMapInner({
  disasters = [],
  warehouses = [],
  reliefCenters = [],
  deliveries = [],
  height = "450px",
}: DisasterMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Central overview

  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  // Filter items with verified coordinates
  const validDisasters = disasters.filter((d) => isValidCoord(d.latitude, d.longitude));
  const validWarehouses = warehouses.filter((w) => isValidCoord(w.latitude, w.longitude));
  const validCenters = reliefCenters.filter((c) => isValidCoord(c.latitude, c.longitude));

  // Determine initial center dynamically if single disaster or warehouse is passed
  const initialCenter: [number, number] =
    validDisasters.length === 1
      ? [validDisasters[0].latitude, validDisasters[0].longitude]
      : validWarehouses.length === 1 && validDisasters.length === 0
      ? [validWarehouses[0].latitude, validWarehouses[0].longitude]
      : validCenters.length === 1 && validDisasters.length === 0 && validWarehouses.length === 0
      ? [validCenters[0].latitude, validCenters[0].longitude]
      : defaultCenter;

  const initialZoom = validDisasters.length === 1 ? 8 : 5;

  return (
    <div
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-md relative z-0"
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Disasters (Red Markers + Hazard Circle) */}
        {validDisasters.map((disaster) => (
          <div key={`disaster-${disaster.id}`}>
            <Marker position={[disaster.latitude, disaster.longitude]} icon={redIcon}>
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded mb-1">
                    {disaster.severity} SEVERITY
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{disaster.name}</h4>
                  <p className="text-xs text-slate-600">Type: {disaster.type.replace("_", " ")}</p>
                  <p className="text-xs text-slate-600">Area: {disaster.affectedArea}</p>
                  <p className="text-xs text-slate-600 font-semibold">
                    Affected Pop: {disaster.estimatedPopulation.toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[disaster.latitude, disaster.longitude]}
              radius={35000}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.18 }}
            />
          </div>
        ))}

        {/* Warehouses (Blue Markers) */}
        {validWarehouses.map((wh) => (
          <Marker key={`wh-${wh.id}`} position={[wh.latitude, wh.longitude]} icon={blueIcon}>
            <Popup>
              <div className="p-1 min-w-[160px]">
                <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded mb-1">
                  WAREHOUSE
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{wh.name}</h4>
                <p className="text-xs text-slate-600">{wh.city}</p>
                <p className="text-xs text-slate-600">Capacity: {wh.capacity} units</p>
                <p className="text-xs font-medium text-slate-700">Utilization: {wh.currentUtilization}%</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Relief Camps & Hospitals (Green Markers) */}
        {validCenters.map((rc) => (
          <Marker key={`rc-${rc.id}`} position={[rc.latitude, rc.longitude]} icon={greenIcon}>
            <Popup>
              <div className="p-1 min-w-[170px]">
                <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-emerald-600 rounded mb-1">
                  {rc.type.replace("_", " ")}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{rc.name}</h4>
                <p className="text-xs text-slate-600">{rc.city}</p>
                <p className="text-xs text-slate-600">Occupancy: {rc.currentPopulation} people</p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    rc.emergencyLevel === "Critical" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  Emergency: {rc.emergencyLevel}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Delivery Shipments & Convoys (Orange Markers + Route Polylines) */}
        {deliveries.map((del) => {
          if (
            !del.sourceWarehouse ||
            !del.destinationCenter ||
            !isValidCoord(del.sourceWarehouse.latitude, del.sourceWarehouse.longitude) ||
            !isValidCoord(del.destinationCenter.latitude, del.destinationCenter.longitude)
          ) {
            return null;
          }

          const midLat = (del.sourceWarehouse.latitude + del.destinationCenter.latitude) / 2;
          const midLng = (del.sourceWarehouse.longitude + del.destinationCenter.longitude) / 2;

          return (
            <div key={`del-${del.id}`}>
              <Polyline
                positions={[
                  [del.sourceWarehouse.latitude, del.sourceWarehouse.longitude],
                  [del.destinationCenter.latitude, del.destinationCenter.longitude],
                ]}
                pathOptions={{
                  color: del.status === "Delivered" ? "#10b981" : "#f97316",
                  weight: 3,
                  dashArray: del.status === "Delivered" ? undefined : "6, 8",
                  opacity: 0.8,
                }}
              />
              <Marker position={[midLat, midLng]} icon={orangeIcon}>
                <Popup>
                  <div className="p-1 min-w-[170px]">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-orange-600 rounded mb-1">
                      LOGISTICS CONVOY
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{del.assignedVehicle}</h4>
                    <p className="text-xs text-slate-600">Driver: {del.driverName}</p>
                    <p className="text-xs text-slate-600">Status: <strong className="text-slate-800">{del.status.replace("_", " ")}</strong></p>
                    <p className="text-xs text-slate-500 mt-1">
                      {del.sourceWarehouse.name} → {del.destinationCenter.name}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
