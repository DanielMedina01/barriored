import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point, Technician } from '../../domain/models';
export default function ServiceMap({
  technicians,
  origin,
  onSelect,
}: {
  technicians: Technician[];
  origin: Point;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    setTileError(false);
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(
      [origin.lat, origin.lng],
      14,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
      .on('tileerror', () => setTileError(true))
      .addTo(map);
    L.circleMarker([origin.lat, origin.lng], {
      radius: 8,
      color: 'white',
      weight: 3,
      fillColor: '#347bea',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip('Tu zona de búsqueda');
    technicians.forEach((t) => {
      const marker = L.marker([t.location.lat, t.location.lng], {
        title: `Ver perfil de ${t.name}`,
        icon: L.divIcon({
          className: 'map-pin',
          html: `<span>${t.initials.replace(/[^A-ZÁÉÍÓÚÑ]/gi, '').slice(0, 2)}</span>`,
          iconSize: [44, 48],
          iconAnchor: [22, 48],
        }),
      }).addTo(map);
      const tooltip = document.createElement('span');
      tooltip.textContent = t.name;
      marker.bindTooltip(tooltip).on('click', () => onSelect(t.id));
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [origin, technicians, onSelect]);
  return (
    <div className="map-wrap">
      <div
        ref={container}
        className="service-map"
        aria-label="Mapa de técnicos. También puedes acceder a sus perfiles desde la lista."
      />
      {tileError && (
        <div className="map-warning">
          El mapa necesita conexión. Los perfiles guardados siguen disponibles en la lista.
        </div>
      )}
      <span className="map-legend">
        <i />
        Zona de búsqueda <b />
        Técnicos de ejemplo
      </span>
    </div>
  );
}
