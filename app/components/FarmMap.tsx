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

// NDVI zone config — offsets + colors to simulate multi-zone crop health overlay
const NDVI_ZONES = [
  { lat: -0.005, lon:  0.012, r: 200, fillColor: "#f43f5e", label: "High Stress",    ndvi: "0.42" },
  { lat:  0.008, lon: -0.009, r: 350, fillColor: "#22c55e", label: "Vigorous",        ndvi: "0.81" },
  { lat: -0.012, lon:  0.004, r: 150, fillColor: "#f43f5e", label: "Disease Risk",    ndvi: "0.39" },
  { lat:  0.015, lon: -0.015, r: 400, fillColor: "#22c55e", label: "Healthy",         ndvi: "0.77" },
  { lat: -0.002, lon: -0.011, r: 250, fillColor: "#f59e0b", label: "Moderate Stress", ndvi: "0.61" },
  { lat:  0.011, lon:  0.008, r: 300, fillColor: "#22c55e", label: "Normal Vigor",    ndvi: "0.72" },
];

export const FarmMap = () => {
  const { profile, updateProfile } = useAuth();
  const [position, setPosition] = useState<[number, number]>([26.8467, 80.9462]);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
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
      return await res.json();
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
          let district = "Unknown", state = "Unknown", city = "Unknown";
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
            locationData: { city, state, display: locString, lat, lon, source: "gps", fullAddress: locString },
            location: locString
          });
        }, () => {}, { timeout: 10000 });
      }
    } else if (profile.locationData.lat && profile.locationData.lon) {
      setPosition([profile.locationData.lat, profile.locationData.lon]);
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
      setPosition([newPos.lat, newPos.lng]);
      const geoData = await reverseGeocode(newPos.lat, newPos.lng);
      let locString = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
      if (geoData?.address) {
        const addr = geoData.address;
        const district = addr.state_district || addr.city || "";
        locString = [district, addr.state, addr.country].filter(Boolean).join(", ");
      }
      if (profile?.locationData) {
        await updateProfile({
          locationData: { ...profile.locationData, lat: newPos.lat, lon: newPos.lng, source: "manual", fullAddress: locString },
          location: locString
        });
      }
    }
  };

  if (typeof window === "undefined" || !L)
    return <div className="h-[400px] w-full rounded-3xl bg-white/5 animate-pulse flex items-center justify-center">Initializing Mapper...</div>;

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            tileSize={512} zoomOffset={-1} maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* Farm Marker */}
        <Marker position={position} draggable={true} eventHandlers={{ dragend: handleDragEnd }}>
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-bold uppercase tracking-widest text-[#050505]">
              Your Farm Plot<p className="mt-1 text-[8px] opacity-60">Drag to precisely set location</p>
            </div>
          </Popup>
        </Marker>

        {/* Mandi Marker */}
        <Marker position={[position[0] - 0.025, position[1] + 0.015]}>
          <Popup className="custom-popup">
            <div className="p-2 text-xs font-bold uppercase tracking-widest text-blue-900 border-l-2 border-blue-500 pl-2">
              <span className="flex items-center gap-1"><Store className="w-3 h-3" />Central Hub Mandi</span>
              <p className="mt-1 text-[9px] opacity-80 text-blue-800">Current Wheat Rate: ₹2250/qtl</p>
            </div>
          </Popup>
        </Marker>

        {/* Core farm healthy zone */}
        <Circle center={position} radius={500} pathOptions={{ fillColor: "#22c55e", color: "#22c55e", fillOpacity: 0.12, weight: 1 }}>
          <Popup>🟢 Healthy Crop Zone — NDVI: 0.78 (High Vigor)</Popup>
        </Circle>

        {/* NDVI Multi-Zone Heatmap */}
        {NDVI_ZONES.map((zone, i) => (
          <Circle
            key={i}
            center={[position[0] + zone.lat, position[1] + zone.lon]}
            radius={zone.r}
            pathOptions={{ fillColor: zone.fillColor, color: zone.fillColor, fillOpacity: 0.28, stroke: false }}
          >
            <Popup>
              <b>{zone.label}</b><br />NDVI: {zone.ndvi}<br />
              {zone.fillColor === "#f43f5e" ? "⚠ Pathogen stress detected" : zone.fillColor === "#f59e0b" ? "⚡ Monitor closely" : "✅ Good growing conditions"}
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Top badge */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="rounded-full bg-[#050505]/90 px-4 py-2 border border-[#00C3FF]/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,195,255,0.2)]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#00C3FF] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00C3FF] uppercase tracking-widest">
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "🛰 Satellite + NDVI Zones" : "NDVI Heatmap Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* NDVI Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-[#050505]/90 p-4 backdrop-blur-md border border-white/10 flex flex-col gap-3">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">GIS Coordinates</p>
          <p className="text-[10px] font-mono text-white">{position[0].toFixed(4)}, {position[1].toFixed(4)}</p>
        </div>
        <div className="h-px w-full bg-white/10" />
        <div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">NDVI Health Map</p>
          <div className="flex flex-col gap-1.5">
            {[
              { cls: "bg-green-500/60 border-green-500",  label: "High Vigor (0.72–0.92)" },
              { cls: "bg-amber-500/60 border-amber-500",  label: "Moderate (0.55–0.71)" },
              { cls: "bg-red-500/60 border-red-500",      label: "Stress (<0.55)" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-sm border ${item.cls}`} />
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
