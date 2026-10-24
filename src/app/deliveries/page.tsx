"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, MapPin, ArrowRight, ShieldCheck, CheckCircle2, Clock, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { DeliveryStatus } from "@prisma/client";

interface DeliveryItem {
  id: string;
  assignedVehicle: string;
  driverName: string;
  driverPhone: string;
  status: DeliveryStatus;
  departureTime?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  trackingNotes?: string;
  sourceWarehouse: { name: string; city: string };
  destinationCenter: { name: string; city: string };
  request: { id: string; priority: string; disaster: { name: string } };
}

export default function DeliveriesPage() {
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch("/api/deliveries");
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/deliveries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchDeliveries();
        showToast(`Delivery status updated to ${newStatus}`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusBadge: Record<DeliveryStatus, string> = {
    Pending: "badge-warning",
    Dispatched: "badge-info",
    In_Transit: "badge-info",
    Delivered: "badge-success",
    Delayed: "badge-critical",
    Cancelled: "badge-neutral",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>Emergency Supply Logistics & Delivery Dispatch</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logistics tracking pipeline monitoring convoy departures, transit speeds, and verified deliveries.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading logistics shipments...</div>
      ) : deliveries.length === 0 ? (
        <div className="saas-card p-8 text-center text-slate-500 text-xs">
          No delivery shipments recorded.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="saas-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <Link
                      href={`/deliveries/${delivery.id}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <span>{delivery.assignedVehicle}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      Driver: <span className="text-slate-800 font-semibold">{delivery.driverName}</span> ({delivery.driverPhone})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/deliveries/${delivery.id}`}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    View Details
                  </Link>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${statusBadge[delivery.status]}`}>
                    {delivery.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Route Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Source Hub</span>
                  <p className="font-bold text-slate-900">{delivery.sourceWarehouse.name}</p>
                  <p className="text-slate-500">{delivery.sourceWarehouse.city}</p>
                </div>

                <div className="flex items-center justify-center text-indigo-600 hidden md:flex">
                  <ArrowRight className="w-5 h-5" />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Destination Center</span>
                  <p className="font-bold text-slate-900">{delivery.destinationCenter.name}</p>
                  <p className="text-slate-500">{delivery.destinationCenter.city}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Status Notes: {delivery.trackingNotes || "On schedule"}</span>
                </div>

                <div className="flex items-center gap-2">
                  {delivery.status === "Pending" && (
                    <button
                      onClick={() => handleUpdateStatus(delivery.id, "Dispatched")}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold hover:bg-indigo-100"
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {delivery.status === "Dispatched" && (
                    <button
                      onClick={() => handleUpdateStatus(delivery.id, "In_Transit")}
                      className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-semibold hover:bg-sky-100"
                    >
                      Mark In Transit
                    </button>
                  )}
                  {delivery.status === "In_Transit" && (
                    <button
                      onClick={() => handleUpdateStatus(delivery.id, "Delivered")}
                      className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                    >
                      Confirm Delivered
                    </button>
                  )}
                  {delivery.status === "Delivered" && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
