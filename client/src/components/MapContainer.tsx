import { useEffect, useMemo, useState } from 'react';
import { CRS, LatLngExpression } from 'leaflet';
import { ImageOverlay, MapContainer as LeafletMap, useMap, useMapEvents } from 'react-leaflet';
import HydrantMarker from './HydrantMarker';
import { Hydrant } from '@/types';

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
  onPreview: (h: Hydrant) => void;
};

export default function MapContainer({ hydrants, onPreview }: MapProps) {
  const [zoom, setZoom] = useState(0);
  const assetBase = useMemo(() => new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString(), []);
  const mapUrl = useMemo(() => new URL('pku-map.png', assetBase).toString(), [assetBase]);

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
      <ImageOverlay url={mapUrl} bounds={bounds} />
      <FitBoundsOnce />
      <ZoomWatcher onZoomChange={setZoom} />
      {hydrants.map((h) => (
        <HydrantMarker key={h.id} hydrant={h} zoom={zoom} onPreview={onPreview} />
      ))}
    </LeafletMap>
  );
}
