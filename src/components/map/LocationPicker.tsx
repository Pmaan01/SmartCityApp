"use client";

import { useState, useCallback } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAP_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
// Must be a stable reference — recreating this array causes LoadScript to reload
const LIBRARIES: ("places")[] = ["places"];

interface Props {
  onSelect: (lat: number, lng: number, address: string) => void;
}

export default function LocationPicker({ onSelect }: Props) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [center, setCenter] = useState(DEFAULT_CENTER);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });

      // Geocoding API requires it to be enabled in Google Cloud Console.
      // Falls back to showing coordinates if not enabled.
      try {
        const geocoder = new google.maps.Geocoder();
        const res = await geocoder.geocode({ location: { lat, lng } });
        const addr = res.results[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(addr);
        onSelect(lat, lng, addr);
      } catch {
        const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(coords);
        onSelect(lat, lng, coords);
      }
    },
    [onSelect]
  );

  const locateMe = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
        <span className="text-gray-400 text-sm">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={center}
        zoom={13}
        onClick={handleMapClick}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {marker && <MarkerF position={marker} />}
      </GoogleMap>

      <button
        type="button"
        onClick={locateMe}
        className="absolute top-3 right-3 bg-white dark:bg-gray-800 shadow px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50"
      >
        Use my location
      </button>

      {address && (
        <div className="absolute bottom-3 left-3 right-3 bg-white dark:bg-gray-900 rounded-lg shadow px-3 py-2 text-xs text-gray-600 dark:text-gray-300 truncate">
          📍 {address}
        </div>
      )}

      {!marker && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            Click the map to pin the issue location
          </div>
        </div>
      )}
    </div>
  );
}
