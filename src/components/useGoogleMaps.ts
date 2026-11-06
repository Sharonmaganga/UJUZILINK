"use client";
import { useEffect, useState } from "react";
import { usePublicConfig } from "./Providers";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    __ujuziMapsLoading?: Promise<void>;
  }
}

/** Loads the Google Maps JavaScript API once and reports when it is ready. */
export function useGoogleMaps() {
  const { mapsKey: MAPS_KEY } = usePublicConfig();
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.google?.maps);
  const [error, setError] = useState(MAPS_KEY ? "" : "Map unavailable: Google Maps API key not set");

  useEffect(() => {
    if (!MAPS_KEY || window.google?.maps) {
      if (window.google?.maps) setReady(true);
      return;
    }
    if (!window.__ujuziMapsLoading) {
      window.__ujuziMapsLoading = new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&v=weekly`;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Could not load Google Maps"));
        document.head.appendChild(s);
      });
    }
    window.__ujuziMapsLoading.then(() => setReady(true)).catch((e: Error) => setError(e.message));
  }, [MAPS_KEY]);

  return { ready, error };
}
