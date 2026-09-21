"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
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
}

export default function DisasterMapInner({
  disasters = [],
  warehouses = [],
  reliefCenters = [],
}: DisasterMapProps) {
  // Default map center (India overview or default Kerala/Coastal coordinates)
  const defaultCenter: [number, number] = [18.0, 78.0];

  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  return (
    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Disasters (Red Markers + Hazard Circle) */}
        {disasters.map((disaster) => (
          <div key={`disaster-${disaster.id}`}>
            <Marker
              position={[disaster.latitude, disaster.longitude]}
              icon={redIcon}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded mb-1">
                    {disaster.severity} SEVERITY
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{disaster.name}</h4>
                  <p className="text-xs text-slate-600">Type: {disaster.type}</p>
                  <p className="text-xs text-slate-600">Area: {disaster.affectedArea}</p>
                  <p className="text-xs text-slate-600 font-semibold">
                    Affected Pop: {disaster.estimatedPopulation.toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[disaster.latitude, disaster.longitude]}
              radius={25000}
              pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.15 }}
            />
          </div>
        ))}

        {/* Warehouses (Blue Markers) */}
        {warehouses.map((wh) => (
          <Marker
            key={`wh-${wh.id}`}
            position={[wh.latitude, wh.longitude]}
            icon={blueIcon}
          >
            <Popup>
              <div className="p-1">
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
        {reliefCenters.map((rc) => (
          <Marker
            key={`rc-${rc.id}`}
            position={[rc.latitude, rc.longitude]}
            icon={greenIcon}
          >
            <Popup>
              <div className="p-1">
                <span className="inline-block px-2 py-0.5 text-xs font-bold text-white bg-emerald-600 rounded mb-1">
                  {rc.type.replace("_", " ")}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{rc.name}</h4>
                <p className="text-xs text-slate-600">{rc.city}</p>
                <p className="text-xs text-slate-600">
                  Current Occupancy: {rc.currentPopulation} residents
                </p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  rc.emergencyLevel === "Critical" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  Emergency: {rc.emergencyLevel}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
