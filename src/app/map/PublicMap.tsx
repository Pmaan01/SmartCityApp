"use client";

import { useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";

// Must match LocationPicker's libraries exactly — the Google Maps loader is a singleton
const LIBRARIES: ("places")[] = ["places"];

type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: number;
  lat: number;
  lng: number;
  address: string | null;
  createdAt: Date;
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#f59e0b",
  3: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export default function PublicMap({ issues }: { issues: Issue[] }) {
  const [selected, setSelected] = useState<Issue | null>(null);
  const [filter, setFilter] = useState("ALL");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const filtered = filter === "ALL" ? issues : issues.filter((i) => i.category === filter);
  const categories = ["ALL", ...Array.from(new Set(issues.map((i) => i.category)))];
  const center = issues.length
    ? { lat: issues[0].lat, lng: issues[0].lng }
    : { lat: 40.7128, lng: -74.006 };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <span className="text-gray-400">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Category filter */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap max-w-sm">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shadow transition ${
              filter === cat
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={12}
        options={{ streetViewControl: false, mapTypeControl: false }}
        onClick={() => setSelected(null)}
      >
        {filtered.map((issue) => (
          <MarkerF
            key={issue.id}
            position={{ lat: issue.lat, lng: issue.lng }}
            onClick={() => setSelected(issue)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8 + issue.priority * 2,
              fillColor: PRIORITY_COLORS[issue.priority] ?? "#6b7280",
              fillOpacity: 0.85,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
        ))}

        {selected && (
          <InfoWindowF
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-sm max-w-xs">
              <p className="font-semibold text-gray-900 mb-1">{selected.title}</p>
              <p className="text-gray-500 text-xs mb-1">{selected.category.replace("_", " ")}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                selected.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                selected.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </span>
              {selected.address && (
                <p className="text-gray-400 text-xs mt-1.5">📍 {selected.address}</p>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-6 right-3 bg-white dark:bg-gray-900 rounded-xl shadow px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</p>
        {[["Low", "#6b7280"], ["Medium", "#f59e0b"], ["High", "#ef4444"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
