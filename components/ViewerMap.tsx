"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation,
  ZoomableGroup,
} from "react-simple-maps";

// Higher detail — includes country names in properties
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Country name lookup from ISO numeric code to name (for labels)
const COUNTRY_NAMES: Record<string, string> = {
  "840": "USA", "826": "UK", "276": "Germany", "250": "France",
  "124": "Canada", "036": "Australia", "356": "India", "156": "China",
  "076": "Brazil", "392": "Japan", "528": "Netherlands", "702": "Singapore",
  "710": "South Africa", "566": "Nigeria", "404": "Kenya", "818": "Egypt",
  "288": "Ghana", "120": "Cameroon", "784": "UAE", "682": "Saudi Arabia",
  "376": "Israel", "752": "Sweden", "578": "Norway", "208": "Denmark",
  "246": "Finland", "756": "Switzerland", "040": "Austria", "056": "Belgium",
  "724": "Spain", "380": "Italy", "616": "Poland", "643": "Russia",
  "804": "Ukraine", "484": "Mexico", "032": "Argentina", "152": "Chile",
  "170": "Colombia", "604": "Peru", "410": "South Korea", "360": "Indonesia",
  "458": "Malaysia", "608": "Philippines", "764": "Thailand", "704": "Vietnam",
  "586": "Pakistan", "050": "Bangladesh", "554": "New Zealand", "792": "Turkey",
  "364": "Iran", "504": "Morocco", "012": "Algeria", "788": "Tunisia",
  "620": "Portugal", "300": "Greece", "642": "Romania", "203": "Czech Rep.",
  "348": "Hungary", "442": "Luxembourg", "372": "Ireland",
};

// Which countries to show labels for (large/important ones only, to avoid clutter)
const LABEL_COUNTRIES = new Set([
  "840", "076", "643", "156", "036", "124", "356", "036",
  "818", "566", "710", "682", "484", "032", "704", "360",
  "826", "250", "276", "724", "380", "792", "364",
]);

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

// Country centroids [lat, lng]
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

// Country name labels positioned at centroids
const COUNTRY_LABELS: Array<{ name: string; coordinates: [number, number] }> = [
  { name: "USA", coordinates: [-98, 38] },
  { name: "Canada", coordinates: [-96, 60] },
  { name: "Mexico", coordinates: [-102, 24] },
  { name: "Brazil", coordinates: [-52, -10] },
  { name: "Argentina", coordinates: [-64, -35] },
  { name: "UK", coordinates: [-2, 54] },
  { name: "France", coordinates: [2, 46] },
  { name: "Germany", coordinates: [10, 51] },
  { name: "Spain", coordinates: [-4, 40] },
  { name: "Italy", coordinates: [12, 42] },
  { name: "Russia", coordinates: [100, 62] },
  { name: "China", coordinates: [104, 36] },
  { name: "India", coordinates: [79, 21] },
  { name: "Japan", coordinates: [138, 37] },
  { name: "Australia", coordinates: [134, -26] },
  { name: "Egypt", coordinates: [30, 27] },
  { name: "Nigeria", coordinates: [8, 9] },
  { name: "S. Africa", coordinates: [25, -29] },
  { name: "Saudi Arabia", coordinates: [45, 24] },
  { name: "Turkey", coordinates: [35, 39] },
  { name: "Iran", coordinates: [53, 32] },
  { name: "Indonesia", coordinates: [118, -2] },
  { name: "Vietnam", coordinates: [108, 14] },
  { name: "Algeria", coordinates: [3, 28] },
  { name: "Kazakhstan", coordinates: [67, 48] },
];

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

  // Set of active country codes for highlighting
  const activeCodes = new Set(locations.map(l => l.countryCode?.toUpperCase()));

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

        {/* Map */}
        <div
          className="flex-1 relative rounded-xl overflow-hidden border border-slate-200"
          style={{ minHeight: "280px", background: "#d4e8f7" }}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 118, center: [10, 15] }}
            style={{ width: "100%", height: "280px" }}
          >
            <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={8}>

              {/* Countries with borders + highlight active ones */}
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const numId = geo.id?.toString().padStart(3, "0");
                    const isActive = false; // highlight via pins instead
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#dde8d0"
                        stroke="#b8cfa8"
                        strokeWidth={0.4}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "#c8dbb8" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Country name labels */}
              {COUNTRY_LABELS.map((label) => (
                <Annotation
                  key={label.name}
                  subject={label.coordinates}
                  dx={0}
                  dy={0}
                  connectorProps={{}}
                >
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={5.5}
                    fontWeight="500"
                    fill="#6b7280"
                    style={{ pointerEvents: "none", userSelect: "none", fontFamily: "sans-serif" }}
                  >
                    {label.name}
                  </text>
                </Annotation>
              ))}

              {/* Viewer pins */}
              {pins.map((pin, i) => {
                const isTop = i === 0;
                const isSelected = selected?.countryCode?.toUpperCase() === pin.code;
                const color = isTop ? "#0ea5e9" : "#a855f7";

                return (
                  <Marker key={pin.code} coordinates={[pin.lng, pin.lat]}>
                    {/* Pulse ring */}
                    {isTop && (
                      <circle r={pin.radius + 8} fill={color} fillOpacity={0.12}>
                        <animate attributeName="r" values={`${pin.radius};${pin.radius + 18};${pin.radius}`} dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="fill-opacity" values="0.18;0;0.18" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Outer glow ring */}
                    <circle
                      r={isSelected ? pin.radius + 5 : pin.radius + 2}
                      fill={color}
                      fillOpacity={isSelected ? 0.3 : 0.15}
                    />

                    {/* Main dot */}
                    <circle
                      r={isSelected ? pin.radius + 1 : pin.radius}
                      fill={color}
                      fillOpacity={0.92}
                      stroke="white"
                      strokeWidth={isSelected ? 2.5 : 1.8}
                      style={{
                        cursor: "pointer",
                        filter: isSelected ? `drop-shadow(0 0 5px ${color})` : "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                      }}
                      onClick={() => setSelected(isSelected ? null : pin)}
                    />

                    {/* View count inside pin */}
                    {pin.radius > 9 && (
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={pin.radius * 0.65}
                        fontWeight="700"
                        fill="white"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {pin.views}
                      </text>
                    )}

                    {/* Country label under small pins */}
                    {pin.radius <= 9 && (
                      <text
                        textAnchor="middle"
                        y={pin.radius + 7}
                        fontSize={5}
                        fontWeight="600"
                        fill={color}
                        style={{ pointerEvents: "none", userSelect: "none", fontFamily: "sans-serif" }}
                      >
                        {pin.country}
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
                className="absolute top-3 left-3 bg-slate-900 rounded-xl shadow-2xl p-3 z-50"
                style={{ minWidth: "170px" }}
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

                {selected.topCities && selected.topCities.length > 1 && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">All Cities</p>
                    {selected.topCities.map((city, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5">
                        <span className="h-1 w-1 rounded-full bg-violet-400" />
                        <span className="text-[10px] text-slate-300">{city}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selected.percentage}%`,
                        background: "linear-gradient(90deg, #0ea5e9, #a855f7)"
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-2 right-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-[9px] text-slate-500">Top country</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
              <span className="text-[9px] text-slate-500">Other</span>
            </div>
            <span className="text-[9px] text-slate-400">Dot size = views</span>
          </div>

          <div className="absolute bottom-2 left-3 text-[9px] text-slate-400 bg-white/80 px-2 py-1 rounded-md border border-slate-100">
            Scroll to zoom · Drag to pan · Click pin for details
          </div>
        </div>

        {/* Country sidebar */}
        <div className="w-44 shrink-0 space-y-1.5">
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
                <span className="text-base leading-none shrink-0">{flagEmoji(loc.countryCode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">{loc.country}</p>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">{loc.percentage}%</span>
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