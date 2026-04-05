"use client";

import React, { useEffect, useState } from "react";
import { Store } from "lucide-react";
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

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!profile?.locationData) {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosition([lat, lon]);
          
          const geoData = await reverseGeocode(lat, lon);
          let locString = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          let district = "Unknown";
          let state = "Unknown";
          let city = "Unknown";

          if (geoData?.address) {
             const addr = geoData.address;
             const village = addr.village || addr.suburb || addr.town || "";
             district = addr.state_district || addr.county || addr.city || "";
             state = addr.state || "";
             const country = addr.country || "";
             city = addr.city || village || district || "Unknown";
             const parts = [village && `Vill: ${village}`, district && `Dist: ${district}`, state, country].filter(Boolean);
             if (parts.length > 0) locString = parts.join(", ");
          }

          await updateProfile({
            locationData: { 
              city,
              state,
              display: locString,
              lat, 
              lon, 
              source: "gps", 
              fullAddress: locString 
            },
            location: locString
          });
        }, () => {}, { timeout: 10000 });
      }
    } else if (profile.locationData.lat && profile.locationData.lon) {
      setPosition([profile.locationData.lat, profile.locationData.lon]);
      // Attempt to reverse geocode if fullAddress is missing but we have coords
      if (!profile.locationData.fullAddress && profile.locationData.source !== "manual") {
          reverseGeocode(profile.locationData.lat, profile.locationData.lon).then(async (geoData) => {
             if (geoData?.address) {
                const addr = geoData.address;
                const village = addr.village || addr.suburb || addr.town || "";
                const district = addr.state_district || addr.county || addr.city || "";
                const state = addr.state || "";
                const country = addr.country || "";
                const parts = [village && `Vill: ${village}`, district && `Dist: ${district}`, state, country].filter(Boolean);
                if (parts.length > 0) {
                    await updateProfile({
                       locationData: { ...profile.locationData!, fullAddress: parts.join(", ") },
                       location: parts.join(", ")
                    });
                }
             }
          });
      }
    }
  }, [profile?.locationData]);

  const handleDragEnd = async (e: any) => {
    const marker = e.target;
    if (marker) {
      const newPos = marker.getLatLng();
      const updatedPos: [number, number] = [newPos.lat, newPos.lng];
      setPosition(updatedPos);
      
      const geoData = await reverseGeocode(newPos.lat, newPos.lng);
      let locString = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
      if (geoData?.address) {
          const addr = geoData.address;
          const district = addr.state_district || addr.city || "";
          locString = [district, addr.state, addr.country].filter(Boolean).join(", ");
      }

      // Update location data in profile
      if (profile?.locationData) {
        await updateProfile({
          locationData: {
            ...profile.locationData,
            lat: newPos.lat,
            lon: newPos.lng,
            source: "manual",
            fullAddress: locString
          },
          location: locString
        });
      }
    }
  };

  if (typeof window === "undefined" || !L) return <div className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse flex items-center justify-center">Initializing Mapper...</div>;

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        {/* Satellite or Street map based on token availability */}
        {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        
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

        {/* Nearby Mandi Marker */}
        <Marker 
          position={[position[0] - 0.025, position[1] + 0.015]} 
        >
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-bold uppercase tracking-widest text-blue-900 border-l-2 border-blue-500 pl-2">
              <span className="flex items-center gap-1"><Store className="w-3 h-3"/> Central Hub Mandi</span>
              <p className="mt-1 text-[9px] opacity-80 text-blue-800">Current Wheat Rate: ₹2250/qtl</p>
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
            fillOpacity: 0.15 
          }} 
        >
          <Popup>Healthy Crop Zone: Vigorous growth detected</Popup>
        </Circle>
        
        {/* Heatmap Scatter */}
        {[-0.005, 0.008, -0.012, 0.015, -0.002, 0.011].map((offsetLat, i) => {
           const offsetLon = [0.012, -0.009, 0.004, -0.015, -0.011, 0.008][i];
           const radius = [200, 350, 150, 400, 250, 300][i];
           return (
              <Circle 
                key={i}
                center={[position[0] + offsetLat, position[1] + offsetLon]} 
                radius={radius} 
                pathOptions={{ 
                  fillColor: "red", 
                  color: "red", 
                  fillOpacity: 0.25 + (Math.random() * 0.2), // randomized intensity
                  stroke: false
                }} 
              >
                <Popup>⚠ High Risk Hotspot: Pathogen stress detected</Popup>
              </Circle>
           );
        })}
      </MapContainer>

      {/* Map Overlay Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
         <div className="rounded-full bg-[#050505]/90 px-4 py-2 border border-[#00C3FF]/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,195,255,0.2)]">
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-[#00C3FF] animate-pulse" />
             <span className="text-[10px] font-bold text-[#00C3FF] uppercase tracking-widest">
               {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "🛰 Mapbox Satellite Live" : "Heatmap Mode"}
             </span>
           </div>
         </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-[#050505]/90 p-4 backdrop-blur-md border border-white/10 flex flex-col gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">GIS Coordinates</p>
          <p className="text-[10px] font-mono text-white">{position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
        </div>
        <div className="h-px w-full bg-white/10" />
        <div className="flex flex-col gap-1.5">
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-sm bg-green-500/50 border border-green-500" />
             <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Optimal Vigor</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-sm bg-red-500/50 border border-red-500" />
             <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Stress / High Risk</span>
           </div>
        </div>
      </div>
    </div>
  );
};
