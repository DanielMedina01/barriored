import { describe, expect, it } from 'vitest';
import {
  approximateLocation,
  distanceKm,
  filterTechnicians,
  validateRequest,
  withReviews,
} from './services';
import { MEDELLIN, type Review } from './models';
import { technicians } from '../data/seed';
describe('Búsqueda hiperlocal', () => {
  it('calcula distancias simétricas y cero para la misma ubicación', () => {
    expect(distanceKm(MEDELLIN, MEDELLIN)).toBe(0);
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.195, 2);
    expect(distanceKm(MEDELLIN, technicians[0].location)).toBeCloseTo(
      distanceKm(technicians[0].location, MEDELLIN),
    );
  });
  it('combina filtros y ordena por distancia', () => {
    const options = {
      origin: MEDELLIN,
      radius: 5,
      minRating: 4.8,
      available: true,
      category: 'all',
      query: '',
    };
    const result = filterTechnicians(technicians, options);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.available && t.rating >= 4.8 && t.distance <= 5)).toBe(true);
    expect(result.map((t) => t.distance)).toEqual(
      result.map((t) => t.distance).sort((a, b) => a - b),
    );
    expect(
      filterTechnicians(technicians, { ...options, query: 'mecanica', category: 'mecanica' }).map(
        (t) => t.id,
      ),
    ).toEqual(['t3']);
    expect(filterTechnicians(technicians, { ...options, radius: 0.01 })).toEqual([]);
  });
});
describe('Privacidad y solicitudes', () => {
  it('reduce la precisión pública del GPS a una celda aproximada', () => {
    expect(approximateLocation(MEDELLIN)).toEqual({ lat: 6.24, lng: -75.58 });
    expect(approximateLocation(MEDELLIN)).not.toEqual(MEDELLIN);
  });
  it('rechaza descripciones vacías o demasiado cortas', () => {
    expect(() =>
      validateRequest({ title: 'Arreglar', description: '   ', zone: 'Laureles' }),
    ).toThrow();
    expect(() =>
      validateRequest({
        title: '    a    ',
        description: 'La ducha gotea desde ayer.',
        zone: 'Laureles',
      }),
    ).toThrow();
    expect(() =>
      validateRequest({
        title: 'Reparar ducha',
        description: 'La ducha gotea desde ayer.',
        zone: 'Laureles',
      }),
    ).not.toThrow();
  });
  it('incorpora reseñas sin perder el peso de la reputación inicial', () => {
    const t = { ...technicians[0], rating: 4, reviewCount: 2 };
    const reviews: Review[] = [
      {
        id: 'r',
        requestId: 's',
        technicianId: t.id,
        author: 'Vecino',
        rating: 1,
        comment: 'Servicio de prueba',
        createdAt: new Date().toISOString(),
      },
    ];
    expect(withReviews(t, reviews).rating).toBe(3);
    expect(withReviews(t, reviews).reviewCount).toBe(3);
  });
});
