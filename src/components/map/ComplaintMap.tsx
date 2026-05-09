"use client";
import dynamic from "next/dynamic";
import { BHATKAL_CENTER } from "@/lib/constants";

// Dynamically import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface ComplaintWithLocation {
  id: string;
  title: string;
  status: string;
  ward_name?: string;
  ticket_id?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  complaints: ComplaintWithLocation[];
  center?: [number, number];
  zoom?: number;
}

export default function ComplaintMap({
  complaints,
  center = [BHATKAL_CENTER.lat, BHATKAL_CENTER.lng],
  zoom = BHATKAL_CENTER.zoom,
}: Props) {
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-[var(--glass-border)]">
      <MapView complaints={complaints} center={center} zoom={zoom} />
    </div>
  );
}
