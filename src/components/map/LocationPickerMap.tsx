"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import LeafletFix from "./LeafletFix";
import { BHATKAL_CENTER } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

interface Props {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

function ClickHandler({ onChange }: { onChange: Props["onChange"] }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ value, onChange }: Props) {
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : [BHATKAL_CENTER.lat, BHATKAL_CENTER.lng];

  return (
    <MapContainer center={center} zoom={BHATKAL_CENTER.zoom} className="w-full h-full" style={{ width: "100%", height: "100%" }}>
      <LeafletFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      {value && <Marker position={[value.lat, value.lng]} />}
    </MapContainer>
  );
}
