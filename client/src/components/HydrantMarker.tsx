import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { Hydrant } from '@/types';

const THUMB_ZOOM = 0.5; // show thumbnails after roughly three zoom-ins from initial

function buildThumbIcon(url: string): DivIcon {
  return L.divIcon({
    className: 'hydrant-thumb',
    iconSize: [112, 124],
    iconAnchor: [56, 124],
    html: `
      <div style="position:relative; width:112px; height:124px;">
        <div style="position:absolute; top:14px; left:6px; right:6px; height:100px; padding:4px; background:#ffffff; border:0px solid #e5e7eb; border-radius:16px; box-shadow:0 10px 22px rgba(0,0,0,0.18);">
          <img src="${url}" alt="Hydrant" style="width:100%; height:92px; object-fit:cover; border-radius:12px; border:0px solid rgba(0,0,0,0.04); background:#f8fafc;" />
        </div>
        <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:0; height:0; border-left:9px solid transparent; border-right:9px solid transparent; border-top:11px solid #ffffff; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.18));"></div>
      </div>
    `
  });
}

function buildPinIcon(): DivIcon {
  const svg = encodeURIComponent(`
    <svg width="34" height="48" viewBox="0 0 34 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C8 0 0 7.4 0 16.5C0 29.2 17 48 17 48C17 48 34 29.2 34 16.5C34 7.4 26 0 17 0Z" fill="#ef4444"/>
      <circle cx="17" cy="16" r="6" fill="white"/>
    </svg>
  `);
  return L.divIcon({
    className: 'hydrant-pin',
    iconSize: [34, 48],
    iconAnchor: [17, 48],
    html: `<div style="width:34px; height:48px;">` +
      `<img src="data:image/svg+xml,${svg}" style="width:34px;height:48px;"/>` +
      `</div>`
  });
}

export default function HydrantMarker({ hydrant, zoom, onPreview }: { hydrant: Hydrant; zoom: number; onPreview: (h: Hydrant) => void }) {
  const showThumb = zoom >= THUMB_ZOOM;
  const thumbIcon = useMemo(() => buildThumbIcon(hydrant.image_thumb_path), [hydrant.image_thumb_path]);
  const pinIcon = useMemo(() => buildPinIcon(), []);
  const position: [number, number] = [hydrant.y_coord, hydrant.x_coord];

  if (showThumb) {
    const events = {
      click: () => onPreview(hydrant)
    };
    return (
      <Marker position={position} icon={thumbIcon} draggable={false} eventHandlers={events} zIndexOffset={1000} />
    );
  }

  return (
    <Marker
      position={position}
      icon={pinIcon}
      draggable={false}
      eventHandlers={{ click: () => onPreview(hydrant) }}
      zIndexOffset={900}
    />
  );
}
