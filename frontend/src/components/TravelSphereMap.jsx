import React, { useEffect, useRef, useState } from 'react';
import { Compass, MapPin, Hotel, Landmark, Navigation, ExternalLink, Locate, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/**
 * Creates custom HTML marker icons for TravelSphere points of interest.
 */
const createMarkerHtml = (type, category, isSelected) => {
  let bgColor = 'bg-teal-600';
  let ringColor = 'ring-teal-400/40';
  let iconSvg = `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  if (type === 'DESTINATION') {
    bgColor = 'bg-emerald-600';
    ringColor = 'ring-emerald-400/50';
    iconSvg = `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
  } else if (type === 'HOTEL') {
    bgColor = 'bg-indigo-600';
    ringColor = 'ring-indigo-400/50';
    iconSvg = `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 11h.01"/><path d="M15 7h.01"/><path d="M16 16h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><path d="M18 22v-4"/><path d="M6 22v-4"/><path d="M9 11h.01"/><path d="M9 7h.01"/></svg>`;
  } else if (category === 'BEACH') {
    bgColor = 'bg-sky-600';
    ringColor = 'ring-sky-400/50';
  } else if (category === 'ADVENTURE') {
    bgColor = 'bg-amber-600';
    ringColor = 'ring-amber-400/50';
  } else if (category === 'RELIGIOUS') {
    bgColor = 'bg-purple-600';
    ringColor = 'ring-purple-400/50';
  }

  const selectedClass = isSelected ? 'scale-125 ring-4 ring-white shadow-2xl z-50' : 'hover:scale-110 shadow-lg';

  return `
    <div class="relative flex items-center justify-center transition-transform duration-200 cursor-pointer ${selectedClass}">
      <div class="w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white ring-2 ${ringColor} shadow-md">
        ${iconSvg}
      </div>
      <div class="absolute -bottom-1 w-2 h-2 bg-inherit transform rotate-45 ${bgColor}"></div>
    </div>
  `;
};

/**
 * Creates custom HTML for the user's current location with radar ripple animation.
 */
const createUserLocationHtml = () => {
  return `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></div>
      <div class="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow-lg shadow-cyan-500/50"></div>
    </div>
  `;
};

export const TravelSphereMap = ({
  items = [],
  selectedItem = null,
  userLocation = null,
  onSelectItem = () => {},
  onRequestLocation = () => {},
  isLocating = false,
  className = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    let checkTimer = null;

    const initMap = () => {
      if (!window.L || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Default center: India overview
      const defaultCenter = [21.7679, 78.8718];
      const defaultZoom = 5;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        attributionControl: true
      });

      // OpenStreetMap Standard Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    if (window.L) {
      initMap();
    } else {
      checkTimer = setInterval(() => {
        if (window.L) {
          clearInterval(checkTimer);
          initMap();
        }
      }, 100);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when items or selection change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds();
    let hasPoints = false;

    items.forEach(item => {
      if (!item.latitude || !item.longitude) return;

      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = selectedItem && selectedItem.id === item.id;
      const markerIcon = L.divIcon({
        className: 'travelsphere-custom-marker',
        html: createMarkerHtml(item.type, item.category, isSelected),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      // Popup content
      const priceText = item.price != null
        ? (item.type === 'HOTEL' ? `₹${item.price.toLocaleString('en-IN')}/night` : (item.price > 0 ? `Fee: ₹${item.price}` : 'Free Entry'))
        : null;

      const distanceText = item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : null;

      const popupHtml = `
        <div class="travelsphere-popup font-sans max-w-[240px] text-slate-800 p-1">
          ${item.imageUrl ? `<div class="relative h-24 rounded-lg overflow-hidden mb-2 shadow-inner"><img src="${item.imageUrl}" alt="${item.name}" class="w-full h-full object-cover"/></div>` : ''}
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              ${item.badgeText || item.type}
            </span>
            ${distanceText ? `<span class="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">${distanceText}</span>` : ''}
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-tight mb-1">${item.name}</h4>
          <p class="text-xs text-slate-600 line-clamp-2 mb-2">${item.description || ''}</p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
            <span class="text-xs font-bold text-teal-800">${priceText || ''}</span>
            ${item.detailUrl ? `<a href="${item.detailUrl}" class="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700">View Details &rarr;</a>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectItem(item);
      });

      markersRef.current[item.id] = marker;
      bounds.extend([lat, lng]);
      hasPoints = true;
    });

    // If user selected an item, pan smoothly
    if (selectedItem && selectedItem.latitude && selectedItem.longitude) {
      const sLat = parseFloat(selectedItem.latitude);
      const sLng = parseFloat(selectedItem.longitude);
      map.flyTo([sLat, sLng], 12, { duration: 1.0 });

      const marker = markersRef.current[selectedItem.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [items, selectedItem, mapReady]);

  // Update User Location Marker
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const uIcon = L.divIcon({
        className: 'travelsphere-user-marker',
        html: createUserLocationHtml(),
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      const uMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: uIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-center font-sans py-1">
            <p class="font-bold text-xs text-slate-900">Your Current Location</p>
            <p class="text-[11px] text-slate-500">Searching nearby places from here</p>
          </div>
        `);

      userMarkerRef.current = uMarker;
    }
  }, [userLocation, mapReady]);

  // Map Controls Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([21.7679, 78.8718], 5);
  };

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl ${className}`}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-700/80 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in on map"
            className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out on map"
            className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleResetView}
          title="Reset Overview"
          aria-label="Reset overview map"
          className="bg-slate-900/90 backdrop-blur-md p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl shadow-lg border border-slate-700/80 transition-colors flex items-center justify-center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRequestLocation}
          disabled={isLocating}
          title="Find Near Me"
          aria-label="Center on my location"
          className={`p-2 rounded-xl shadow-lg border transition-all flex items-center justify-center ${
            userLocation
              ? 'bg-teal-600 text-white border-teal-400 ring-2 ring-teal-400/30'
              : 'bg-slate-900/90 backdrop-blur-md text-slate-200 hover:text-teal-400 hover:bg-slate-800 border-slate-700/80'
          }`}
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/90 text-[11px] text-slate-300 shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Destination
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Place
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Hotel
        </span>
        {userLocation && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span> You
          </span>
        )}
      </div>
    </div>
  );
};

export default TravelSphereMap;
