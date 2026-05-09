"use client";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), { ssr: false });

interface Props {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-[var(--glass-border)]">
      <LocationPickerMap value={value} onChange={onChange} />
    </div>
  );
}
