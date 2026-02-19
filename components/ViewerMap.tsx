"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// ── Country centroids (lat/lng) for dot placement ──────────────
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  US: [37.09, -95.71], GB: [55.37, -3.43], DE: [51.16, 10.45],
  FR: [46.23, 2.21],   CA: [56.13, -106.34], AU: [25.27, 133.77],
  IN: [20.59, 78.96],  CN: [35.86, 104.19],  BR: [14.23, -51.92],
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

// ── Simplified world map path data (SVG paths for continents) ──
// Using Mercator-like projection built into the SVG viewBox
const MAP_PATHS = [
  // North America
  { d: "M 85,55 L 90,52 L 100,50 L 115,48 L 125,45 L 135,47 L 145,52 L 148,58 L 145,65 L 140,70 L 135,75 L 130,85 L 125,90 L 120,88 L 115,82 L 108,80 L 100,85 L 95,92 L 90,88 L 85,80 L 82,70 L 80,62 Z", fill: "#e2e8f0" },
  // Central America / Caribbean
  { d: "M 120,92 L 125,92 L 128,96 L 126,100 L 122,98 Z", fill: "#e2e8f0" },
  // South America
  { d: "M 115,102 L 125,98 L 135,100 L 145,105 L 150,115 L 155,125 L 158,140 L 155,155 L 148,165 L 140,168 L 132,165 L 125,158 L 118,145 L 112,132 L 110,118 L 112,108 Z", fill: "#e2e8f0" },
  // Europe
  { d: "M 220,38 L 235,35 L 248,33 L 258,35 L 265,38 L 268,44 L 260,50 L 252,52 L 244,55 L 238,58 L 232,55 L 225,52 L 220,48 Z", fill: "#e2e8f0" },
  // Africa
  { d: "M 228,62 L 240,58 L 255,60 L 268,65 L 275,75 L 278,90 L 275,105 L 270,118 L 262,128 L 252,135 L 242,138 L 232,135 L 224,125 L 218,112 L 215,98 L 216,85 L 220,72 Z", fill: "#e2e8f0" },
  // Europe East / Russia partial
  { d: "M 265,30 L 310,25 L 360,22 L 380,28 L 370,35 L 355,38 L 340,40 L 320,42 L 300,44 L 280,46 L 268,44 Z", fill: "#e2e8f0" },
  // Middle East
  { d: "M 272,62 L 285,58 L 298,60 L 305,68 L 300,75 L 290,78 L 278,75 L 272,68 Z", fill: "#e2e8f0" },
  // South Asia
  { d: "M 308,62 L 325,60 L 338,62 L 345,70 L 342,80 L 335,88 L 325,90 L 315,88 L 308,80 L 306,70 Z", fill: "#e2e8f0" },
  // East Asia
  { d: "M 345,40 L 370,38 L 385,42 L 392,50 L 388,60 L 380,68 L 368,72 L 355,70 L 345,62 L 340,52 Z", fill: "#e2e8f0" },
  // Southeast Asia
  { d: "M 355,75 L 375,72 L 390,75 L 398,82 L 395,90 L 385,92 L 372,90 L 360,86 L 355,80 Z", fill: "#e2e8f0" },
  // Australia
  { d: "M 362,128 L 380,122 L 400,120 L 415,125 L 420,135 L 418,148 L 408,155 L 392,158 L 378,155 L 365,148 L 358,138 Z", fill: "#e2e8f0" },
  // Japan / Korea
  { d: "M 390,48 L 398,46 L 402,52 L 398,58 L 392,56 Z", fill: "#e2e8f0" },
];

// ── Mercator projection ─────────────────────────────────────────
const MAP_W = 500;
const MAP_H = 220;

function latLngToXY(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * MAP_W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = MAP_H / 2 - (MAP_H * mercN) / (2 * Math.PI);
  return [x, y];
}

function flagEmoji(code?: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export default function ViewerMap({ locations }: ViewerMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!locations || locations.length === 0) return null;

  const maxViews = Math.max(...locations.map((l) => l.views), 1);

  // Map each location to its SVG coordinates
  const pins = locations
    .map((loc) => {
      const code = loc.countryCode?.toUpperCase();
      const centroid = code ? COUNTRY_CENTROIDS[code] : null;
      if (!centroid) return null;
      const [x, y] = latLngToXY(centroid[0], centroid[1]);
      const intensity = loc.views / maxViews;
      const radius = 4 + intensity * 10; // 4–14px
      return { ...loc, x, y, radius, intensity, code };
    })
    .filter(Boolean) as Array<LocationData & { x: number; y: number; radius: number; intensity: number; code: string }>;

  const hovered = pins.find((p) => p.code === hoveredCountry);

  // Deal intelligence signals
  const multiCountry = locations.length > 1;
  const topLocation = locations[0];
  const hasUnexpectedGeo = locations.some(
    (l) => !["US", "GB", "CA", "AU"].includes(l.countryCode?.toUpperCase() || "")
  );

  return (
    <div className="space-y-4">

      {/* ── Deal intelligence signals ── */}
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

      {/* ── Map + sidebar layout ── */}
      <div className="flex gap-4">

        {/* SVG Map */}
        <div className="flex-1 relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100" style={{ minHeight: "220px" }}>
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className="w-full h-full"
            style={{ display: "block" }}
          >
            {/* Ocean background */}
            <rect width={MAP_W} height={MAP_H} fill="#f0f6ff" />

            {/* Grid lines (latitude) */}
            {[30, 60, 90, 120, 150, 180].map((y) => (
              <line key={y} x1={0} y1={y * (MAP_H / 180)} x2={MAP_W} y2={y * (MAP_H / 180)}
                stroke="#e0eaf6" strokeWidth="0.5" strokeDasharray="3,4" />
            ))}
            {[60, 120, 180, 240, 300, 360, 420].map((x) => (
              <line key={x} x1={x * (MAP_W / 500)} y1={0} x2={x * (MAP_W / 500)} y2={MAP_H}
                stroke="#e0eaf6" strokeWidth="0.5" strokeDasharray="3,4" />
            ))}

            {/* Continent fills */}
            {MAP_PATHS.map((path, i) => (
              <path key={i} d={path.d} fill={path.fill} stroke="#d1dce8" strokeWidth="0.5" />
            ))}

            {/* Pulse rings for top location */}
            {mounted && pins.slice(0, 1).map((pin) => (
              <g key={`pulse-${pin.code}`}>
                <circle cx={pin.x} cy={pin.y} r={pin.radius + 6} fill="#0ea5e9" fillOpacity="0.08">
                  <animate attributeName="r" values={`${pin.radius}; ${pin.radius + 14}; ${pin.radius}`}
                    dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.15; 0; 0.15" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </g>
            ))}

            {/* Connection lines between top 2 locations */}
            {pins.length >= 2 && (
              <line
                x1={pins[0].x} y1={pins[0].y}
                x2={pins[1].x} y2={pins[1].y}
                stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3,4" strokeOpacity="0.3"
              />
            )}

            {/* Location dots */}
            {pins.map((pin) => {
              const isHov = hoveredCountry === pin.code;
              const isTop = pin.code === pins[0]?.code;
              return (
                <g key={pin.code}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredCountry(pin.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Outer ring */}
                  <circle
                    cx={pin.x} cy={pin.y}
                    r={isHov ? pin.radius + 4 : pin.radius + 1}
                    fill={isTop ? "#0ea5e9" : "#a855f7"}
                    fillOpacity={isHov ? 0.2 : 0.12}
                  />
                  {/* Main dot */}
                  <circle
                    cx={pin.x} cy={pin.y}
                    r={isHov ? pin.radius + 1 : pin.radius}
                    fill={isTop ? "#0ea5e9" : "#a855f7"}
                    fillOpacity={0.85 + pin.intensity * 0.15}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {/* View count label for large dots */}
                  {pin.radius > 8 && (
                    <text
                      x={pin.x} y={pin.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="7" fontWeight="700" fill="white"
                    >
                      {pin.views}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                key={hovered.code}
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.12 }}
                className="absolute top-3 left-3 bg-slate-900 rounded-xl shadow-2xl p-3 pointer-events-none z-50 min-w-[160px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl leading-none">{flagEmoji(hovered.code)}</span>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{hovered.country}</p>
                    <p className="text-[10px] text-slate-400">{hovered.percentage}% of views</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 rounded-lg p-2 text-center">
                    <p className="text-base font-black text-sky-400 tabular-nums">{hovered.views}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wide">Views</p>
                  </div>
                  {hovered.topCities && hovered.topCities.length > 0 && (
                    <div className="bg-slate-800 rounded-lg p-2 text-center">
                      <p className="text-[10px] font-bold text-violet-300 truncate">{hovered.topCities[0]}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide">Top City</p>
                    </div>
                  )}
                </div>
                {/* Intent bar */}
                <div className="mt-2">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                      style={{ width: `${hovered.percentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-2 right-3 flex items-center gap-2">
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
        </div>

        {/* Country list sidebar */}
        <div className="w-44 flex-shrink-0 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">By Country</p>
          {locations.map((loc, i) => (
            <div
              key={loc.countryCode || i}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                hoveredCountry === loc.countryCode?.toUpperCase()
                  ? "bg-sky-50 border border-sky-200"
                  : "hover:bg-slate-50 border border-transparent"
              }`}
              onMouseEnter={() => setHoveredCountry(loc.countryCode?.toUpperCase() || null)}
              onMouseLeave={() => setHoveredCountry(null)}
            >
              <span className="text-base leading-none flex-shrink-0">{flagEmoji(loc.countryCode)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{loc.country}</p>
                  <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{loc.percentage}%</span>
                </div>
                {/* Mini bar */}
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
          ))}
        </div>

      </div>
    </div>
  );
}