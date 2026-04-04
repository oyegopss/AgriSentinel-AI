"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/lib/AuthProvider";

// Dynamic import for Leaflet components to avoid SSR errors
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export const FarmMap = () => {
  const { profile, updateProfile } = useAuth();
  const [position, setPosition] = useState<[number, number]>([26.8467, 80.9462]); // Default Lucknow
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // Client-side only Leaflet icon fix
    import("leaflet").then((Leaflet) => {
      setL(Leaflet);
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  useEffect(() => {
    if (profile?.locationData?.lat && profile?.locationData?.lon) {
      setPosition([profile.locationData.lat, profile.locationData.lon]);
    }
  }, [profile?.locationData]);

  const handleDragEnd = async (e: any) => {
    const marker = e.target;
    if (marker) {
      const newPos = marker.getLatLng();
      const updatedPos: [number, number] = [newPos.lat, newPos.lng];
      setPosition(updatedPos);
      
      // Update location data in profile
      if (profile?.locationData) {
        await updateProfile({
          locationData: {
            ...profile.locationData,
            lat: newPos.lat,
            lon: newPos.lng,
            source: "manual"
          },
          location: `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`
        });
      }
    }
  };

  if (typeof window === "undefined" || !L) return <div className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse flex items-center justify-center">Initializing Mapper...</div>;

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {/* Farm Location Marker */}
        <Marker 
          position={position} 
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-bold uppercase tracking-widest text-[#050505]">
              Your Farm Plot
              <p className="mt-1 text-[8px] opacity-60">Drag to precisely set location</p>
            </div>
          </Popup>
        </Marker>

        {/* Risk Zones (Simulated) */}
        <Circle 
          center={position} 
          radius={500} 
          pathOptions={{ 
            fillColor: "green", 
            color: "green", 
            fillOpacity: 0.1 
          }} 
        />
        
        <Circle 
          center={[position[0] + 0.015, position[1] + 0.015]} 
          radius={800} 
          pathOptions={{ 
            fillColor: "red", 
            color: "red", 
            fillOpacity: 0.2 
          }} 
        >
          <Popup>⚠ High Risk Zone: Significant humidity detected</Popup>
        </Circle>
      </MapContainer>

      {/* Map Overlay Controls */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-[#050505]/80 p-3 backdrop-blur-md border border-white/10">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">GIS Coordinates</p>
        <p className="text-[10px] font-mono text-[#00FF9C]">{position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
      </div>
    </div>
  );
};
