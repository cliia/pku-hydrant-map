import { useEffect, useState } from 'react';
import { CRS, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import { ImageOverlay, MapContainer as LeafletMap, useMap, useMapEvents } from 'react-leaflet';
import HydrantMarker from './HydrantMarker';
import { Hydrant, Mode } from '@/types';

const IMAGE_HEIGHT = 2568; // y
const IMAGE_WIDTH = 3608; // x
const bounds: [[number, number], [number, number]] = [
  [0, 0],
  [IMAGE_HEIGHT, IMAGE_WIDTH]
];
const center: LatLngExpression = [IMAGE_HEIGHT / 2, IMAGE_WIDTH / 2];

function FitBoundsOnce() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { animate: false });
  }, [map]);
  return null;
}

function ClickCapture({ mode, onAdd }: { mode: Mode; onAdd: (coords: [number, number]) => void }) {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (mode === 'edit') {
        onAdd([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom())
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export type MapProps = {
  hydrants: Hydrant[];
  mode: Mode;
  onAddRequest: (coords: [number, number]) => void;
  onDelete: (id: number) => void;
  onPreview: (h: Hydrant) => void;
  onMove: (id: number, coords: [number, number]) => void;
};

export default function MapContainer({ hydrants, mode, onAddRequest, onDelete, onPreview, onMove }: MapProps) {
  const [zoom, setZoom] = useState(0);

  return (
    <LeafletMap
      crs={CRS.Simple}
      center={center}
      zoom={-1}
      minZoom={-2}
      maxZoom={4}
      maxBounds={bounds}
      bounds={bounds}
      className="h-full w-full rounded-2xl overflow-hidden"
      attributionControl={false}
      zoomControl={false}
    >
      <ImageOverlay url="/pku-map.png" bounds={bounds} />
      <FitBoundsOnce />
      <ClickCapture mode={mode} onAdd={onAddRequest} />
      <ZoomWatcher onZoomChange={setZoom} />
      {hydrants.map((h) => (
        <HydrantMarker key={h.id} hydrant={h} zoom={zoom} mode={mode} onDelete={onDelete} onPreview={onPreview} onMove={onMove} />
      ))}
    </LeafletMap>
  );
}
