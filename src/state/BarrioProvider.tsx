import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Category, Database, Point, Profile, ServiceRequest } from '../domain/models';
import { MEDELLIN } from '../domain/models';
import { approximateLocation, validateRequest, withReviews } from '../domain/services';
import { technicians as seed, initialDatabase } from '../data/seed';
import { LocalBarrioRepository, type BarrioRepository } from '../data/repository';
import { locate } from '../platform/device';

const defaultRepository = new LocalBarrioRepository();
function useBarrioViewModel(repository: BarrioRepository) {
  const [db, setDb] = useState<Database>(initialDatabase);
  const current = useRef(db);
  const queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [origin, setOrigin] = useState<Point>(MEDELLIN);
  const [gps, setGps] = useState(false);
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((data) => {
        if (active) {
          current.current = data;
          setDb(data);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'No se pudieron leer los datos locales.');
      });
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      active = false;
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, [repository]);
  const transact = (change: (state: Database) => Database): Promise<void> => {
    const task = queue.current.then(async () => {
      if (!ready) throw new Error('El almacenamiento todavía no está disponible.');
      const next = change(current.current);
      await repository.save(next);
      current.current = next;
      setDb(next);
    });
    queue.current = task.catch(() => {});
    return task;
  };
  const myTechnician = {
    id: 'local-technician',
    name: db.profile.name,
    category: db.profile.category,
    zone: db.profile.zone,
    location: origin,
    bio: db.profile.bio,
    rating: 0,
    reviewCount: 0,
    jobs: db.requests.filter(
      (r) =>
        r.status === 'completed' &&
        r.quotes.find((q) => q.id === r.acceptedQuoteId)?.technicianId === 'local-technician',
    ).length,
    experience: 0,
    available: true,
    color: 'green',
    initials: db.profile.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join(''),
    price: 0,
    phone: db.profile.phone,
    portfolio: db.profile.portfolio,
  };
  const technicians = [...seed, ...(db.profile.bio ? [myTechnician] : [])].map((t) =>
    withReviews(t, db.reviews),
  );
  return {
    db,
    ready,
    error,
    notice,
    setNotice,
    online,
    origin,
    gps,
    locating,
    technicians,
    async getLocation() {
      setLocating(true);
      try {
        setOrigin(await locate());
        setGps(true);
        setNotice('Ubicación actualizada.');
      } catch {
        setNotice(
          'No pudimos obtener tu ubicación. Puedes seguir explorando la zona de referencia en Medellín. Revisa los permisos e inténtalo otra vez.',
        );
      } finally {
        setLocating(false);
      }
    },
    async saveProfile(profile: Profile) {
      if (profile.name.trim().length < 2)
        throw new Error('Escribe tu nombre (mínimo 2 caracteres).');
      if (profile.zone.trim().length < 3) throw new Error('Indica tu barrio o zona.');
      if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
        throw new Error('Revisa tu correo electrónico.');
      if (profile.phone && !/^(?:\+?57)?3\d{9}$/.test(profile.phone.replace(/[\s()-]/g, '')))
        throw new Error('Escribe un celular colombiano de 10 dígitos.');
      if (profile.role === 'technician' && profile.bio.trim().length < 15)
        throw new Error('Describe tu trabajo con al menos 15 caracteres.');
      await transact((s) => ({
        ...s,
        profile: { ...profile, name: profile.name.trim(), zone: profile.zone.trim() },
      }));
      setNotice('Perfil guardado en este dispositivo.');
    },
    async toggleFavorite(id: string) {
      await transact((s) => ({
        ...s,
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((f) => f !== id)
          : [...s.favorites, id],
      }));
    },
    async createRequest(input: {
      title: string;
      description: string;
      category: Category;
      zone: string;
      urgency: 'today' | 'flexible';
      photo?: string;
    }) {
      validateRequest(input);
      const id = crypto.randomUUID();
      await transact((s) => {
        if (s.profile.role !== 'client')
          throw new Error('Cambia al perfil de vecino para publicar.');
        const request: ServiceRequest = {
          ...input,
          title: input.title.trim(),
          description: input.description.trim(),
          zone: input.zone.trim(),
          id,
          clientId: s.profile.id,
          approximateLocation: approximateLocation(origin),
          status: 'open',
          createdAt: new Date().toISOString(),
          quotes: [],
        };
        return { ...s, requests: [request, ...s.requests] };
      });
      setNotice('Solicitud guardada. Modo demo: no se envía a otros dispositivos.');
      return id;
    },
    async quote(requestId: string, amount: number, message: string, demo = false) {
      if (!Number.isFinite(amount) || amount < 1000 || amount > 100000000)
        throw new Error('Ingresa un valor entre $1.000 y $100.000.000.');
      if (message.trim().length < 10 || message.length > 500)
        throw new Error('Escribe un mensaje de entre 10 y 500 caracteres.');
      await transact((s) => {
        const request = s.requests.find((r) => r.id === requestId);
        if (!request || request.status !== 'open')
          throw new Error('Esta solicitud ya no recibe cotizaciones.');
        if (!demo && s.profile.role !== 'technician')
          throw new Error('Necesitas un perfil técnico para cotizar.');
        const technician = demo ? seed.find((t) => t.category === request.category)! : myTechnician;
        if (request.quotes.some((q) => q.technicianId === technician.id))
          throw new Error('Este técnico ya envió una cotización.');
        return {
          ...s,
          requests: s.requests.map((r) =>
            r.id !== requestId
              ? r
              : {
                  ...r,
                  quotes: [
                    ...r.quotes,
                    {
                      id: crypto.randomUUID(),
                      technicianId: technician.id,
                      name: technician.name,
                      amount,
                      message: message.trim(),
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
          ),
        };
      });
      setNotice(
        demo
          ? 'Respuesta de ejemplo añadida. No proviene de un técnico real.'
          : 'Cotización guardada en este dispositivo.',
      );
    },
    async accept(requestId: string, quoteId: string) {
      await transact((s) => {
        const r = s.requests.find((r) => r.id === requestId);
        if (
          !r ||
          r.status !== 'open' ||
          r.clientId !== s.profile.id ||
          s.profile.role !== 'client' ||
          !r.quotes.some((q) => q.id === quoteId)
        )
          throw new Error('No se puede aceptar esta cotización.');
        return {
          ...s,
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: 'accepted', acceptedQuoteId: quoteId } : r,
          ),
        };
      });
      setNotice('Cotización aceptada. Puedes marcar el servicio como finalizado cuando termine.');
    },
    async finish(requestId: string, status: 'completed' | 'cancelled') {
      await transact((s) => {
        const r = s.requests.find((r) => r.id === requestId);
        if (
          !r ||
          r.clientId !== s.profile.id ||
          s.profile.role !== 'client' ||
          (status === 'completed' ? r.status !== 'accepted' : r.status !== 'open')
        )
          throw new Error('La solicitud no permite esta acción.');
        return {
          ...s,
          requests: s.requests.map((r) => (r.id === requestId ? { ...r, status } : r)),
        };
      });
    },
    async review(requestId: string, rating: number, comment: string) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        throw new Error('Selecciona entre 1 y 5 estrellas.');
      if (comment.trim().length < 5 || comment.length > 500)
        throw new Error('Escribe un comentario de entre 5 y 500 caracteres.');
      await transact((s) => {
        const r = s.requests.find((r) => r.id === requestId);
        const q = r?.quotes.find((q) => q.id === r.acceptedQuoteId);
        if (
          !r ||
          !q ||
          r.status !== 'completed' ||
          s.profile.role !== 'client' ||
          r.clientId !== s.profile.id
        )
          throw new Error('Solo puedes valorar tus servicios finalizados.');
        if (s.reviews.some((r) => r.requestId === requestId))
          throw new Error('Ya valoraste este servicio.');
        return {
          ...s,
          reviews: [
            ...s.reviews,
            {
              id: crypto.randomUUID(),
              requestId,
              technicianId: q.technicianId,
              author: s.profile.name,
              rating,
              comment: comment.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      });
      setNotice('¡Gracias por aportar a la confianza del barrio!');
    },
  };
}
type BarrioState = ReturnType<typeof useBarrioViewModel>;
const BarrioContext = createContext<BarrioState | null>(null);
export function BarrioProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: BarrioRepository;
}) {
  const value = useBarrioViewModel(repository);
  return <BarrioContext.Provider value={value}>{children}</BarrioContext.Provider>;
}
export function useBarrio() {
  const value = useContext(BarrioContext);
  if (!value) throw new Error('Falta BarrioProvider');
  return value;
}
