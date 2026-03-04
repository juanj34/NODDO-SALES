"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PuntoInteres } from "@/types";

interface MapboxMapProps {
  center: [number, number];
  pois: PuntoInteres[];
  onSelectPOI: (poi: PuntoInteres) => void;
  selectedPOI: PuntoInteres | null;
  projectName: string;
}

export function MapboxMap({
  center,
  pois,
  onSelectPOI,
  selectedPOI,
  projectName,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const poiMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("MapboxMap: NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }
    if (!containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 13,
      pitch: 45,
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "bottom-right"
    );

    // Project marker (gold pulsing dot)
    const projectMarkerEl = document.createElement("div");
    projectMarkerEl.className = "project-marker";
    projectMarkerEl.title = projectName;

    new mapboxgl.Marker({ element: projectMarkerEl })
      .setLngLat(center)
      .addTo(map);

    // POI markers (white dots)
    const markersMap = new Map<string, mapboxgl.Marker>();

    pois.forEach((poi) => {
      const poiMarkerEl = document.createElement("div");
      poiMarkerEl.className = "poi-marker";
      poiMarkerEl.title = poi.nombre;

      poiMarkerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPOI(poi);
      });

      const marker = new mapboxgl.Marker({ element: poiMarkerEl })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);

      markersMap.set(poi.id, marker);
    });

    poiMarkersRef.current = markersMap;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      poiMarkersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to selected POI and highlight marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove active class from all POI markers
    poiMarkersRef.current.forEach((marker) => {
      marker.getElement().classList.remove("active");
    });

    if (selectedPOI) {
      // Highlight the selected marker
      const selectedMarker = poiMarkersRef.current.get(selectedPOI.id);
      if (selectedMarker) {
        selectedMarker.getElement().classList.add("active");
      }

      // Fly to the selected POI
      map.flyTo({
        center: [selectedPOI.lng, selectedPOI.lat],
        zoom: 15,
        duration: 1200,
      });
    }
  }, [selectedPOI]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
