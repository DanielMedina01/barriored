import type { Point, ServiceRequest, Technician, Review } from './models';
export function distanceKm(a: Point, b: Point): number {
  const rad = (v: number) => (v * Math.PI) / 180;
  const x =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
// Public requests store an approximate grid cell, never the precise GPS position.
export function approximateLocation(p: Point): Point {
  return { lat: Math.round(p.lat * 100) / 100, lng: Math.round(p.lng * 100) / 100 };
}
export function filterTechnicians(
  technicians: Technician[],
  options: {
    query: string;
    category: string;
    radius: number;
    minRating: number;
    available: boolean;
    origin: Point;
  },
) {
  const normalize = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const q = normalize(options.query.trim());
  return technicians
    .map((t) => ({ ...t, distance: distanceKm(options.origin, t.location) }))
    .filter(
      (t) =>
        (options.category === 'all' || t.category === options.category) &&
        t.distance <= options.radius &&
        t.rating >= options.minRating &&
        (!options.available || t.available) &&
        normalize(`${t.name} ${t.category} ${t.zone} ${t.bio}`).includes(q),
    )
    .sort((a, b) => a.distance - b.distance);
}
export function validateRequest(input: Pick<ServiceRequest, 'title' | 'description' | 'zone'>) {
  if (input.title.trim().length < 6 || input.title.trim().length > 90)
    throw new Error('Escribe un título de entre 6 y 90 caracteres.');
  if (input.description.trim().length < 15 || input.description.trim().length > 1000)
    throw new Error('Describe el trabajo con entre 15 y 1.000 caracteres.');
  if (input.zone.trim().length < 3 || input.zone.trim().length > 80)
    throw new Error('Indica tu barrio o sector (3 a 80 caracteres).');
}
export function withReviews(technician: Technician, reviews: Review[]): Technician {
  const added = reviews.filter((r) => r.technicianId === technician.id);
  const count = technician.reviewCount + added.length;
  return {
    ...technician,
    reviewCount: count,
    rating: count
      ? (technician.rating * technician.reviewCount + added.reduce((sum, r) => sum + r.rating, 0)) /
        count
      : 0,
  };
}
