"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Your existing data shape — NO CHANGES NEEDED in backend ────
type LocationData = {
  country: string;
  countryCode?: string;
  views: number;
  percentage: number;
  topCities?: string[];
};

type ViewerMapProps = {
  locations: LocationData[];
};

// ── Country centroids (lat/lng) for pin placement ──────────────
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  US: [37.09, -95.71], GB: [55.37, -3.43], DE: [51.16, 10.45],
  FR: [46.23, 2.21],   CA: [56.13, -106.34], AU: [-25.27, 133.77],
  IN: [20.59, 78.96],  CN: [35.86, 104.19],  BR: [-14.23, -51.92],
  JP: [36.20, 138.25], NL: [52.13, 5.29],    SG: [1.35, 103.82],
  ZA: [-30.56, 22.93], NG: [9.08, 8.68],     KE: [-0.02, 37.90],
  EG: [26.82, 30.80],  GH: [7.95, -1.02],    CM: [3.85, 11.50],
  AE: [23.42, 53.84],  SA: [23.88, 45.08],   IL: [31.05, 34.85],
  SE: [60.13, 18.64],  NO: [60.47, 8.47],    DK: [56.26, 9.50],
  FI: [61.92, 25.74],  CH: [46.82, 8.23],    AT: [47.52, 14.55],
  BE: [50.50, 4.47],   ES: [40.46, -3.75],   IT: [41.87, 12.56],
  PL: [51.92, 19.15],  RU: [61.52, 105.32],  UA: [48.38, 31.17],
  MX: [23.63, -102.55],AR: [-38.41, -63.62], CL: [-35.67, -71.54],
  CO: [4.57, -74.30],  PE: [-9.19, -75.02],  KR: [35.91, 127.77],
  ID: [-0.79, 113.92], MY: [4.21, 101.97],   PH: [12.88, 121.77],
  TH: [15.87, 100.99], VN: [14.06, 108.28],  PK: [30.38, 69.35],
  BD: [23.68, 90.36],  NZ: [-40.90, 174.89], ZW: [-19.01, 29.15],
  TZ: [-6.37, 34.89],  ET: [9.15, 40.49],    RO: [45.94, 24.97],
  CZ: [49.82, 15.47],  HU: [47.16, 19.50],   GR: [39.07, 21.82],
  PT: [39.40, -8.22],  TR: [38.96, 35.24],   IR: [32.43, 53.69],
  IQ: [33.22, 43.68],  MA: [31.79, -7.09],   TN: [33.89, 9.54],
  DZ: [28.03, 1.66],   LY: [26.34, 17.23],
};

function flagEmoji(code?: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function ViewerMap({ locations }: ViewerMapProps) {
  const [selected, setSelected] = useState<LocationData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!locations || locations.length === 0) return null;

  const maxViews = Math.max(...locations.map((l) => l.views), 1);

  // Build pins from your existing data shape
  const pins = locations
    .map((loc) => {
      const code = loc.countryCode?.toUpperCase();
      const centroid = code ? COUNTRY_CENTROIDS[code] : null;
      if (!centroid) return null;
      const intensity = loc.views / maxViews;
      const radius = 5 + intensity * 12;
      return { ...loc, lat: centroid[0], lng: centroid[1], radius, intensity, code: code! };
    })
    .filter(Boolean) as Array<LocationData & { lat: number; lng: number; radius: number; intensity: number; code: string }>;

  // Deal intelligence signals (from your old component)
  const multiCountry = locations.length > 1;
  const topLocation = locations[0];
  const hasUnexpectedGeo = locations.some(
    (l) => !["US", "GB", "CA", "AU"].includes(l.countryCode?.toUpperCase() || "")
  );

  return (
    <div className="space-y-4">

      {/* Deal intelligence signals */}
      {mounted && (
        <div className="flex flex-wrap gap-2">
          {multiCountry && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {locations.length} countries — doc is circulating
            </div>
          )}
          {topLocation && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700">
              {flagEmoji(topLocation.countryCode)} Highest interest: {topLocation.country} ({topLocation.percentage}%)
            </div>
          )}
          {hasUnexpectedGeo && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-700">
              <span>🔍</span> Views from unexpected region — check forwarding
            </div>
          )}
        </div>
      )}

      {/* Map + sidebar */}
      <div className="flex gap-4">

        {/* Real world map */}
        <div className="flex-1 relative bg-[#f0f6ff] rounded-xl overflow-hidden border border-slate-100" style={{ minHeight: "240px" }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 110, center: [0, 15] }}
            style={{ width: "100%", height: "240px" }}
          >
            <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={6}>

              {/* All countries rendered properly */}
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#e2e8f0"
                      stroke="#f0f6ff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#cbd5e1" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Pins on real coordinates */}
              {pins.map((pin, i) => {
                const isTop = i === 0;
                const isSelected = selected?.countryCode?.toUpperCase() === pin.code;
                const color = isTop ? "#0ea5e9" : "#a855f7";

                return (
                  <Marker key={pin.code} coordinates={[pin.lng, pin.lat]}>
                    {/* Pulse ring on top pin */}
                    {isTop && (
                      <circle r={pin.radius + 8} fill={color} fillOpacity={0.1}>
                        <animate attributeName="r" values={`${pin.radius};${pin.radius + 16};${pin.radius}`} dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="fill-opacity" values="0.15;0;0.15" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Outer glow */}
                    <circle
                      r={isSelected ? pin.radius + 5 : pin.radius + 2}
                      fill={color}
                      fillOpacity={isSelected ? 0.25 : 0.12}
                    />

                    {/* Main clickable dot */}
                    <circle
                      r={isSelected ? pin.radius + 1 : pin.radius}
                      fill={color}
                      fillOpacity={0.9}
                      stroke="white"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{
                        cursor: "pointer",
                        filter: isSelected ? `drop-shadow(0 0 6px ${color})` : undefined,
                      }}
                      onClick={() => setSelected(isSelected ? null : pin)}
                    />

                    {/* View count label for large pins */}
                    {pin.radius > 9 && (
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={pin.radius * 0.7}
                        fontWeight="700"
                        fill="white"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {pin.views}
                      </text>
                    )}
                  </Marker>
                );
              })}

            </ZoomableGroup>
          </ComposableMap>

          {/* Click popup */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.countryCode}
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute top-3 left-3 bg-slate-900 rounded-xl shadow-2xl p-3 z-50 min-w-[170px]"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-white text-xs font-bold px-1"
                >✕</button>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl leading-none">{flagEmoji(selected.countryCode)}</span>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{selected.country}</p>
                    <p className="text-[10px] text-slate-400">{selected.percentage}% of all views</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-slate-800 rounded-lg p-2 text-center">
                    <p className="text-base font-black text-sky-400 tabular-nums">{selected.views}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Views</p>
                  </div>
                  {selected.topCities && selected.topCities.length > 0 && (
                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-violet-300 truncate">{selected.topCities[0]}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide">Top City</p>
                    </div>
                  )}
                </div>

                {/* All cities list */}
                {selected.topCities && selected.topCities.length > 1 && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">All Cities</p>
                    {selected.topCities.map((city, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                        <span className="text-[10px] text-slate-300">{city}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Percentage bar */}
                <div className="mt-2">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                      style={{ width: `${selected.percentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-2 right-3 flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-slate-100">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-[9px] text-slate-400">Top</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
              <span className="text-[9px] text-slate-400">Other</span>
            </div>
            <span className="text-[9px] text-slate-300">Dot size = views</span>
          </div>

          <div className="absolute bottom-2 left-3 text-[9px] text-slate-300">
            Scroll to zoom · Drag to pan · Click pin for details
          </div>
        </div>

        {/* Country sidebar (from your old component) */}
        <div className="w-44 flex-shrink-0 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">By Country</p>
          {locations.map((loc, i) => {
            const isSelected = selected?.countryCode === loc.countryCode;
            return (
              <div
                key={loc.countryCode || i}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-sky-50 border border-sky-200"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
                onClick={() => setSelected(isSelected ? null : loc)}
              >
                <span className="text-base leading-none flex-shrink-0">{flagEmoji(loc.countryCode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">{loc.country}</p>
                    <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{loc.percentage}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${loc.percentage}%`,
                        background: i === 0
                          ? "linear-gradient(90deg, #0ea5e9, #a855f7)"
                          : "#cbd5e1",
                      }}
                    />
                  </div>
                  {loc.topCities && loc.topCities.length > 0 && (
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">{loc.topCities[0]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}