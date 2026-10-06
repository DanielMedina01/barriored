export const categories = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'electricidad', name: 'Electricidad', icon: 'flash' },
  { id: 'plomeria', name: 'Plomería', icon: 'water' },
  { id: 'mecanica', name: 'Mecánica', icon: 'car' },
  { id: 'cerrajeria', name: 'Cerrajería', icon: 'key' },
  { id: 'soldadura', name: 'Soldadura', icon: 'construct' },
  { id: 'carga', name: 'Carga y mudanzas', icon: 'cube' },
] as const;
export type Category = Exclude<(typeof categories)[number]['id'], 'all'>;
export type Point = { lat: number; lng: number };
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'technician';
  zone: string;
  category: Category;
  bio: string;
  phone: string;
  portfolio: string[];
};
export type Technician = {
  id: string;
  name: string;
  category: Category;
  zone: string;
  location: Point;
  bio: string;
  rating: number;
  reviewCount: number;
  jobs: number;
  experience: number;
  available: boolean;
  color: string;
  initials: string;
  price: number;
  phone?: string;
  portfolio: string[];
};
export type Quote = {
  id: string;
  technicianId: string;
  name: string;
  amount: number;
  message: string;
  createdAt: string;
};
export type ServiceRequest = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: Category;
  zone: string;
  approximateLocation: Point;
  urgency: 'today' | 'flexible';
  photo?: string;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  quotes: Quote[];
  acceptedQuoteId?: string;
};
export type Review = {
  id: string;
  requestId: string;
  technicianId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};
export type Database = {
  version: 1;
  profile: Profile;
  requests: ServiceRequest[];
  reviews: Review[];
  favorites: string[];
};
export const MEDELLIN: Point = { lat: 6.2442, lng: -75.5812 };
export const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
export const currency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
