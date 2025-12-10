'use client';

 
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import MapContainer and other leaflet components
// This ensures they are only loaded on the client side
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface GeoMapProps {
  data: Array<{
    lat: number;
    lng: number;
    city: string;
    country: string;
    count: number;
  }>;
}

export default function GeoHeatMap({ data }: GeoMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {data.map((location, idx) => (
        <CircleMarker
          key={idx}
          center={[location.lat, location.lng]}
          radius={Math.min(location.count * 3, 20)}
          fillColor="#8B5CF6"
          color="#6D28D9"
          weight={2}
          opacity={0.8}
          fillOpacity={0.6}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{location.city}, {location.country}</p>
              <p className="text-slate-600">{location.count} signatures</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
