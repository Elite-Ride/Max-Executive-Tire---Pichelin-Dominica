import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap, 
  useMapsLibrary, 
  useAdvancedMarkerRef 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Phone, 
  MessageSquare, 
  Car, 
  Layers, 
  Route, 
  Key, 
  ExternalLink, 
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Wrench,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { SHOP_LOCATION_INFO, WORKSHOP_HOURS } from '../data/servicesData';

// Exact Coordinates for Max Executive Tires at Maranatha Square, Pichelin, Dominica
const SHOP_COORDINATES = { lat: 15.2472, lng: -61.3289 };

// Surrounding Dominica towns & distance hub presets for interactive driving routes
const DOMINICA_START_POINTS = [
  { id: 'roseau', name: 'Roseau (Capital)', coords: { lat: 15.3015, lng: -61.3883 }, time: '~20 mins', dist: '13.5 km' },
  { id: 'grandbay', name: 'Grand Bay / Berricoa', coords: { lat: 15.2347, lng: -61.3142 }, time: '~6 mins', dist: '3.8 km' },
  { id: 'bellevue', name: 'Bellevue Chopin', coords: { lat: 15.2652, lng: -61.3541 }, time: '~7 mins', dist: '4.2 km' },
  { id: 'soufriere', name: 'Soufrière / Scotts Head', coords: { lat: 15.2355, lng: -61.3601 }, time: '~14 mins', dist: '8.1 km' },
  { id: 'petitesavanne', name: 'Bagatelle / Petite Savanne', coords: { lat: 15.2505, lng: -61.2855 }, time: '~16 mins', dist: '9.4 km' },
];

const checkIsValidKey = (key: string | undefined): boolean => {
  if (!key) return false;
  const trimmed = key.trim();
  if (
    trimmed === 'YOUR_API_KEY' || 
    trimmed === '@react-google-maps/api' || 
    trimmed.includes('@') ||
    trimmed.includes('MY_GOOGLE_MAPS')
  ) {
    return false;
  }
  // Standard Google Maps Platform API keys start with AIza
  if (!trimmed.startsWith('AIza')) return false;
  return trimmed.length >= 25;
};

// Inner component to handle Route calculations using modern GMP Routes library (computeRoutes)
const RouteRenderer: React.FC<{
  originCoords: google.maps.LatLngLiteral | null;
  onRouteComputed?: (info: { distance: string; duration: string }) => void;
}> = ({ originCoords, onRouteComputed }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !originCoords) {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      return;
    }

    // Clear existing polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin: originCoords,
      destination: SHOP_COORDINATES,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    })
      .then(({ routes }) => {
        if (routes && routes[0]) {
          const leg = routes[0];
          const distKm = leg.distanceMeters ? `${(leg.distanceMeters / 1000).toFixed(1)} km` : '';
          const mins = leg.durationMillis ? `${Math.round(leg.durationMillis / 60000)} mins` : '';

          if (onRouteComputed) {
            onRouteComputed({ distance: distKm, duration: mins });
          }

          if (leg.path && leg.path.length > 0) {
            const poly = new google.maps.Polyline({
              path: leg.path,
              strokeColor: '#0984E3',
              strokeOpacity: 0.9,
              strokeWeight: 5,
              map: map,
            });
            polylinesRef.current.push(poly);
          }

          if (leg.viewport) {
            map.fitBounds(leg.viewport, 40);
          }
        }
      })
      .catch((err) => {
        console.warn('Google Maps computeRoutes fallback notice:', err);
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, originCoords]);

  return null;
};

// Map Recenter Helper
const MapRecenter: React.FC<{
  center: google.maps.LatLngLiteral;
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
};

export const GoogleMapsStoreLocator: React.FC = () => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('roseau');
  const [routeStats, setRouteStats] = useState<{ distance: string; duration: string } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [embedZoom, setEmbedZoom] = useState(15);
  const [embedType, setEmbedType] = useState<'m' | 'k'>('m'); // m = roadmap, k = satellite

  // Read stored or environment key
  const [activeKey, setActiveKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('max_executive_gmp_key');
      if (stored) return stored;
    }
    return (
      process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      ''
    );
  });

  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    const originalGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setAuthFailed(true);
      if (typeof originalGmAuthFailure === 'function') {
        originalGmAuthFailure();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.message?.includes('InvalidKeyMapError') ||
        event.message?.includes('Google Maps JavaScript API') ||
        event.message?.includes('gm_authFailure')
      ) {
        setAuthFailed(true);
      }
    };
    window.addEventListener('error', handleWindowError);

    return () => {
      (window as any).gm_authFailure = originalGmAuthFailure;
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  const hasValidKey = checkIsValidKey(activeKey) && !authFailed;
  const activeOrigin = DOMINICA_START_POINTS.find((p) => p.id === selectedOrigin) || DOMINICA_START_POINTS[0];

  const handleRecenterShop = () => {
    setIsNavigating(false);
    setInfoOpen(true);
    setEmbedZoom(15);
  };

  const handleStartRoute = (originId: string) => {
    setSelectedOrigin(originId);
    setIsNavigating(true);
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKeyInput.trim()) {
      localStorage.setItem('max_executive_gmp_key', customKeyInput.trim());
      setActiveKey(customKeyInput.trim());
      setShowKeySetup(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('max_executive_gmp_key');
    setActiveKey('');
    setCustomKeyInput('');
  };

  return (
    <div id="google-maps-store-locator" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
      
      {/* Header bar with Status & Live Route Controls */}
      <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Maps Interactive Workshop Locator
            </div>
            {hasValidKey ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                Live Maps API Active
              </span>
            ) : (
              <button
                onClick={() => setShowKeySetup(!showKeySetup)}
                className="text-[10px] text-blue-300 hover:text-white underline font-medium flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                <span>Custom Key Setup</span>
              </button>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Maranatha Square Location & Directions</span>
            <span className="text-amber-400 text-sm font-serif italic hidden sm:inline">• Pichelin, Dominica</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Interactive map marker with driving route preview to our dedicated fitment & repair bays.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRecenterShop}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Compass className="w-3.5 h-3.5 text-[#0984E3]" />
            Center Maranatha Square
          </button>

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=15.2472,-61.3289"
            target="_blank"
            rel="noopener noreferrer"
            id="btn-get-directions"
            data-testid="btn-get-directions"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
            title="Open turn-by-turn navigation in Google Maps or your default map app"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-300" />
            <span>Get Directions</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Optional Custom API Key Drawer */}
      {showKeySetup && (
        <div className="mx-4 sm:mx-6 p-4 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-1.5 text-blue-400">
              <Key className="w-4 h-4" />
              <span>Google Maps Platform API Key Configuration</span>
            </div>
            <button
              onClick={() => setShowKeySetup(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-slate-300 text-[11px]">
            To activate vector map layers and real-time SDK routing, enter your Google Maps Platform key below. The interactive map marker for Maranatha Square works seamlessly with or without an active key.
          </p>
          <form onSubmit={handleSaveCustomKey} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="AIzaSy..."
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg transition text-xs"
            >
              Save Key
            </button>
            {hasValidKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs"
              >
                Reset
              </button>
            )}
          </form>
        </div>
      )}

      {/* Main Content Grid: Map + Interactive Directions Panel */}
      <div className="p-4 sm:p-6 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Map Canvas with Interactive Marker */}
        <div className="lg:col-span-8 space-y-3">
          
          <div className="relative w-full h-[460px] sm:h-[500px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            
            {hasValidKey ? (
              /* FULL GOOGLE MAPS API SDK IMPLEMENTATION WITH ADVANCED MARKER */
              <APIProvider apiKey={activeKey} version="weekly">
                <Map
                  defaultCenter={SHOP_COORDINATES}
                  defaultZoom={13}
                  mapId="DEMO_MAP_ID"
                  mapTypeId={mapTypeId}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  fullscreenControl={true}
                  streetViewControl={false}
                >
                  {/* Shop Location Interactive Marker */}
                  <AdvancedMarker
                    ref={markerRef}
                    position={SHOP_COORDINATES}
                    title="Max Executive Tires Inc. - Maranatha Square, Pichelin"
                    onClick={() => setInfoOpen(true)}
                  >
                    <Pin
                      background="#0984E3"
                      borderColor="#C29B38"
                      glyphColor="#FFFFFF"
                      scale={1.3}
                    />
                  </AdvancedMarker>

                  {/* Shop Interactive InfoWindow */}
                  {infoOpen && (
                    <InfoWindow
                      anchor={marker}
                      onCloseClick={() => setInfoOpen(false)}
                      maxWidth={320}
                    >
                      <div className="p-2 space-y-2 text-slate-800 font-sans">
                        <div className="border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold uppercase text-[#0984E3] tracking-wide block">
                            Direct Drive-In Workshop
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                            Max Executive Tires Inc.
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Maranatha Square, Pichelin, Dominica
                          </p>
                        </div>

                        <div className="text-xs space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Mon–Sat: 7:30 AM – 6:00 PM</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Mounting, Balancing & Vulcanization</span>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-100">
                          <a
                            href="https://www.google.com/maps/dir/?api=1&destination=15.2472,-61.3289"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-black py-1.5 rounded-lg text-center inline-flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Navigation className="w-3 h-3 text-amber-300" />
                            <span>Get Directions (Open Map App)</span>
                          </a>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold py-1 rounded text-center inline-flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-emerald-600 text-white text-[10px] font-bold py-1 rounded hover:bg-emerald-500 text-center inline-flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}

                  {/* Other Dominica Town Waypoint Markers */}
                  {DOMINICA_START_POINTS.map((pt) => (
                    <AdvancedMarker
                      key={pt.id}
                      position={pt.coords}
                      title={pt.name}
                      onClick={() => handleStartRoute(pt.id)}
                    >
                      <Pin
                        background={selectedOrigin === pt.id && isNavigating ? '#E17055' : '#64748B'}
                        glyphColor="#FFFFFF"
                        scale={0.9}
                      />
                    </AdvancedMarker>
                  ))}

                  {/* Route Polyline Renderer */}
                  {isNavigating && (
                    <RouteRenderer
                      originCoords={activeOrigin.coords}
                      onRouteComputed={(stats) => setRouteStats(stats)}
                    />
                  )}
                </Map>
              </APIProvider>
            ) : (
              /* INTERACTIVE GOOGLE MAP EMBED WITH PROMINENT INTERACTIVE MARKER */
              <div className="relative w-full h-full">
                <iframe
                  title="Max Executive Tires at Maranatha Square Pichelin"
                  src={`https://maps.google.com/maps?q=15.2472,-61.3289+(Max+Executive+Tires+Maranatha+Square+Pichelin)&t=${embedType}&z=${embedZoom}&output=embed`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                ></iframe>

                {/* Custom Pin for Maranatha Square */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                  <button
                    onClick={() => setInfoOpen(!infoOpen)}
                    id="custom-pin-maranatha-square"
                    data-testid="custom-pin-maranatha-square"
                    className="relative group cursor-pointer focus:outline-hidden"
                    title="Maranatha Square - Max Executive Tires (Click for Directions & Details)"
                  >
                    {/* Animated Pulsing Rings */}
                    <span className="absolute -inset-3 rounded-full bg-blue-500/50 animate-ping pointer-events-none"></span>
                    <span className="absolute -inset-6 rounded-full bg-amber-400/20 pointer-events-none"></span>
                    
                    {/* Executive Custom Pin Badge */}
                    <div className="relative flex flex-col items-center">
                      <div className="bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white p-3 rounded-2xl shadow-2xl border-2 border-amber-400 group-hover:scale-110 group-hover:border-amber-300 transition-all duration-200">
                        <MapPin className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                      {/* Needle Pointer */}
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400 -mt-0.5"></div>
                      
                      {/* Custom Pin Floating Label */}
                      <div className="bg-slate-950/95 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xl mt-1.5 border border-amber-400/60 whitespace-nowrap flex items-center gap-1.5 group-hover:bg-slate-900">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Maranatha Square</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Interactive Info Window for Maranatha Square Marker */}
                {infoOpen && (
                  <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-30 animate-fade-in text-slate-800 font-sans">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#0984E3] tracking-wider block">
                          Drive-In Workshop Bays
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          Max Executive Tires Inc.
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Maranatha Square, Pichelin, Dominica
                        </p>
                      </div>
                      <button
                        onClick={() => setInfoOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-xs space-y-1.5 py-2 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Mon–Sat: 7:30 AM – 6:00 PM</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Mounting, Balancing & Vulcanizing</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-[11px] font-mono">15.2472° N, 61.3289° W</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=15.2472,-61.3289"
                        target="_blank"
                        rel="noopener noreferrer"
                        id="btn-pin-get-directions"
                        data-testid="btn-pin-get-directions"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black py-2 rounded-xl text-center inline-flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-300" />
                        <span>Get Directions (Open Map App)</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 rounded-lg text-center inline-flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg text-center inline-flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* Map App Switcher Links */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-center gap-2.5 text-[10px] text-slate-500">
                        <span>Open in:</span>
                        <a 
                          href="https://www.google.com/maps/dir/?api=1&destination=15.2472,-61.3289" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Google Maps
                        </a>
                        <span>•</span>
                        <a 
                          href="https://maps.apple.com/?daddr=15.2472,-61.3289" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-700 font-bold hover:underline"
                        >
                          Apple Maps
                        </a>
                        <span>•</span>
                        <a 
                          href="https://waze.com/ul?ll=15.2472,-61.3289&navigate=yes" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-700 font-bold hover:underline"
                        >
                          Waze
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded Map Controls (Zoom & Type Switcher) */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-300 shadow-sm flex items-center gap-1 z-20 text-xs">
                  <button
                    onClick={() => setEmbedType('m')}
                    className={`px-2 py-0.5 rounded font-medium transition ${embedType === 'm' ? 'bg-[#0984E3] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setEmbedType('k')}
                    className={`px-2 py-0.5 rounded font-medium transition ${embedType === 'k' ? 'bg-[#0984E3] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    Satellite
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button
                    onClick={() => setEmbedZoom((prev) => Math.min(prev + 1, 19))}
                    className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEmbedZoom((prev) => Math.max(prev - 1, 11))}
                    className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Map Style Overlay Toggle Switcher for Full API */}
            {hasValidKey && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-300 shadow-sm flex items-center gap-1 z-10 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => setMapTypeId('roadmap')}
                  className={`px-2.5 py-1 rounded transition ${mapTypeId === 'roadmap' ? 'bg-[#0984E3] text-white font-bold' : 'hover:bg-slate-100'}`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMapTypeId('hybrid')}
                  className={`px-2.5 py-1 rounded transition ${mapTypeId === 'hybrid' ? 'bg-[#0984E3] text-white font-bold' : 'hover:bg-slate-100'}`}
                >
                  Satellite / Terrain
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0984E3]" />
              <strong>Coordinates:</strong> 15.2472° N, 61.3289° W (Maranatha Square, Pichelin)
            </span>
            <span className="text-slate-400">
              Interactive Map Marker Active
            </span>
          </div>
        </div>

        {/* Right 4 Cols: Interactive Route Direction Selector */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0984E3] flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5" />
                Dominica Driving Routes
              </span>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Calculate Directions to Pichelin
              </h4>
              <p className="text-xs text-slate-600">
                Select your departure location to preview driving route and travel time to Maranatha Square:
              </p>
            </div>

            {/* Departure Towns List */}
            <div className="space-y-2">
              {DOMINICA_START_POINTS.map((pt) => {
                const isSelected = selectedOrigin === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => handleStartRoute(pt.id)}
                    className={`w-full text-left p-3 rounded-lg border transition text-xs flex items-center justify-between ${
                      isSelected && isNavigating
                        ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isSelected && isNavigating ? 'bg-[#0984E3]' : 'bg-slate-300'}`}></div>
                      <div>
                        <span className="font-bold text-slate-900 block">{pt.name}</span>
                        <span className="text-[11px] text-slate-500">via South Link Road</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0984E3] block">{pt.time}</span>
                      <span className="text-[10px] text-slate-400">{pt.dist}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calculated Route Info Banner */}
            {isNavigating && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Route: {activeOrigin.name} &rarr; Pichelin
                </div>
                <div className="flex items-center justify-between text-emerald-700 pt-1 border-t border-emerald-200/60">
                  <span>Est. Time: <strong>{routeStats?.duration || activeOrigin.time}</strong></span>
                  <span>Distance: <strong>{routeStats?.distance || activeOrigin.dist}</strong></span>
                </div>
              </div>
            )}

            {/* Quick Contact Box */}
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${activeOrigin.coords.lat},${activeOrigin.coords.lng}&destination=15.2472,-61.3289`}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-driving-route-get-directions"
                data-testid="btn-driving-route-get-directions"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title={`Get live turn-by-turn driving directions from ${activeOrigin.name} to Maranatha Square`}
              >
                <Navigation className="w-3.5 h-3.5 text-amber-300" />
                <span>Get Directions from {activeOrigin.name}</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <a
                href={`tel:${SHOP_LOCATION_INFO.phonePrimary.replace(/[^0-9+]/g, '')}`}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call Workshop: {SHOP_LOCATION_INFO.phonePrimary}</span>
              </a>
              <a
                href={`https://wa.me/${SHOP_LOCATION_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20Max%20Executive%20Tires,%20I%20am%20driving%20from%20${encodeURIComponent(activeOrigin.name)}%20to%20your%20Pichelin%20shop`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Arrival Notice</span>
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
