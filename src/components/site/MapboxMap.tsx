"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PuntoInteres } from "@/types";

type MapStyle = "satellite" | "streets";

const MAP_STYLES: Record<MapStyle, string> = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  streets: "mapbox://styles/mapbox/dark-v11",
};

interface MapboxMapProps {
  center: [number, number];
  pois: PuntoInteres[];
  onSelectPOI: (poi: PuntoInteres) => void;
  selectedPOI: PuntoInteres | null;
  projectName: string;
  mapStyle?: MapStyle;
}

// Generate a polygon around a center point (~250m radius)
function generateProjectPolygon(center: [number, number]): GeoJSON.Feature {
  const [lng, lat] = center;
  const offset = 0.0025; // ~250m
  const offsetLng = offset * 1.2;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lng - offsetLng, lat - offset],
        [lng + offsetLng, lat - offset],
        [lng + offsetLng * 0.8, lat + offset * 0.5],
        [lng + offsetLng, lat + offset],
        [lng - offsetLng, lat + offset],
        [lng - offsetLng * 0.8, lat + offset * 0.5],
        [lng - offsetLng, lat - offset],
      ]],
    },
  };
}

export function MapboxMap({
  center,
  pois,
  onSelectPOI,
  selectedPOI,
  projectName,
  mapStyle = "satellite",
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const poiMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const projectMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const onSelectPOIRef = useRef(onSelectPOI);
  onSelectPOIRef.current = onSelectPOI;

  const addPolygonLayer = useCallback((map: mapboxgl.Map) => {
    const sourceId = "project-boundary";
    if (map.getSource(sourceId)) return;

    map.addSource(sourceId, {
      type: "geojson",
      data: generateProjectPolygon(center),
    });

    map.addLayer({
      id: "project-boundary-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "rgba(201, 169, 110, 0.12)",
      },
    });

    map.addLayer({
      id: "project-boundary-line",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "rgba(201, 169, 110, 0.5)",
        "line-width": 2,
        "line-dasharray": [3, 2],
      },
    });
  }, [center]);

  const createMarkers = useCallback((map: mapboxgl.Map, hidden = false) => {
    // Clear old markers
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current.clear();
    projectMarkerRef.current?.remove();

    // Project marker
    const projectEl = document.createElement("div");
    projectEl.className = "project-marker-wrapper";
    if (hidden) {
      projectEl.style.opacity = "0";
      projectEl.style.transition = "opacity 0.8s ease-in-out";
    }
    const markerDot = document.createElement("div");
    markerDot.className = "project-marker";
    const markerLabel = document.createElement("div");
    markerLabel.className = "project-marker-label";
    markerLabel.textContent = projectName;
    projectEl.appendChild(markerDot);
    projectEl.appendChild(markerLabel);
    projectMarkerRef.current = new mapboxgl.Marker({ element: projectEl })
      .setLngLat(center)
      .addTo(map);

    // POI markers — simple dot + tooltip
    pois.forEach((poi) => {
      const wrapper = document.createElement("div");
      wrapper.className = "poi-marker-wrapper";
      if (hidden) {
        wrapper.style.opacity = "0";
        wrapper.style.transition = "opacity 0.8s ease-in-out";
      }
      const dot = document.createElement("div");
      dot.className = "poi-marker-dot";
      const tooltip = document.createElement("div");
      tooltip.className = "poi-marker-tooltip";
      tooltip.textContent = poi.nombre;
      wrapper.appendChild(dot);
      wrapper.appendChild(tooltip);
      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPOIRef.current(poi);
      });

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);

      poiMarkersRef.current.set(poi.id, marker);
    });
  }, [center, pois, projectName]);

  // Initialize map
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapStyle],
      center: [-74.0817, 4.6097], // Default to approx center of Colombia/Bogota for a good fly-in starting point
      zoom: 1, // Start zoomed all the way out
      pitch: 0,
      projection: 'globe', // Use globe projection
    });

    const showMarkers = () => {
      poiMarkersRef.current.forEach((marker) => {
        marker.getElement().style.opacity = "1";
      });
      if (projectMarkerRef.current) {
        projectMarkerRef.current.getElement().style.opacity = "1";
      }
    };

    map.on('style.load', () => {
      // Add atmosphere for the globe
      map.setFog({
        color: 'rgb(186, 210, 235)', // Lower atmosphere
        'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
        'horizon-blend': 0.02, // Atmosphere thickness
        'space-color': 'rgb(11, 11, 25)', // Background color
        'star-intensity': 0.6 // Background star brightness
      });

      // Add 3D buildings
      const layers = map.getStyle()?.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
      )?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#111113', // Dark surface-1 color
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.8
          }
        },
        labelLayerId
      );
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      addPolygonLayer(map);

      // Execute the cinematic fly-in
      setTimeout(() => {
        map.flyTo({
          center,
          zoom: 16, // Zoom in close to see buildings
          pitch: 65, // High pitch for cinematic 3D feel
          bearing: -25, // Slight rotation
          duration: 4500, // 4.5 seconds for the sweep
          essential: true // this animation is considered essential with respect to prefers-reduced-motion
        });

        // Show markers when animation is almost done
        setTimeout(showMarkers, 4000);
      }, 500); // Slight delay so the globe renders first before moving
    });

    createMarkers(map, true); // Create with hidden=true so markers are invisible during fly-in
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      poiMarkersRef.current.clear();
      projectMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(MAP_STYLES[mapStyle]);

    map.once("style.load", () => {
      addPolygonLayer(map);
    });
  }, [mapStyle, addPolygonLayer]);

  // Fly to selected POI and highlight marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove active class from all
    poiMarkersRef.current.forEach((marker) => {
      marker.getElement().classList.remove("active");
    });

    if (selectedPOI) {
      const selectedMarker = poiMarkersRef.current.get(selectedPOI.id);
      if (selectedMarker) {
        selectedMarker.getElement().classList.add("active");
      }

      map.flyTo({
        center: [selectedPOI.lng, selectedPOI.lat],
        zoom: 15,
        duration: 1200,
      });
    }
  }, [selectedPOI]);

  return <div ref={containerRef} className="w-full h-full" />;
}
