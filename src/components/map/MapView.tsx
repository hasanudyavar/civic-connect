"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import LeafletFix from "./LeafletFix";
import { BHATKAL_CENTER } from "@/lib/constants";
import { STATUS_CONFIG } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

interface Complaint {
  id: string;
  title: string;
  status: string;
  ward_name?: string;
  ticket_id?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  complaints: Complaint[];
  center: [number, number];
  zoom: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  ASSIGNED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#006948",
  REOPENED: "#f97316",
  CLOSED: "#6b7280",
  ESCALATED: "#ef4444",
  // Lowercase fallbacks
  open: "#ef4444",
  in_progress: "#f59e0b",
  resolved: "#006948",
  closed: "#6b7280",
};

export default function MapView({ complaints, center, zoom }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full" style={{ width: "100%", height: "100%" }}>
      <LeafletFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {complaints.map((c) => (
        <Marker key={c.id} position={[c.latitude, c.longitude]}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-gray-900">{c.title}</p>
              {c.ticket_id && <p className="text-xs text-gray-500">#{c.ticket_id}</p>}
              <p className="text-xs">
                Status:{" "}
                <span className="font-bold" style={{ color: STATUS_COLORS[c.status] || "#6b7280" }}>
                  {c.status.replace(/_/g, " ")}
                </span>
              </p>
              {c.ward_name && <p className="text-xs text-gray-600">Ward: {c.ward_name}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
