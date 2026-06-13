"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const MAP_STYLE = { width: "100%", height: "100%" };
const LIBRARIES: ("places")[] = ["places"];

interface Props {
  lat: number;
  lng: number;
}

export default function IssueMap({ lat, lng }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
        <span className="text-gray-400 text-sm">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={{ lat, lng }}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          draggable: false,
          scrollwheel: false,
        }}
      >
        <MarkerF position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}
