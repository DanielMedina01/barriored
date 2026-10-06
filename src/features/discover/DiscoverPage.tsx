import { lazy, Suspense, useMemo, useState } from 'react';
import {
  arrowForwardOutline,
  flashOutline,
  searchOutline,
  optionsOutline,
  mapOutline,
  listOutline,
  locateOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  closeOutline,
} from 'ionicons/icons';
import { categories } from '../../domain/models';
import { filterTechnicians } from '../../domain/services';
import { useBarrio } from '../../state/BarrioProvider';
import { categoryIcons, Empty, Icon, TechnicianCard } from '../../ui/components';
const ServiceMap = lazy(() => import('./ServiceMap'));
export default function DiscoverPage({
  onCreate,
  onProfile,
}: {
  onCreate: () => void;
  onProfile: (id: string) => void;
}) {
  const { technicians, db, origin, getLocation, locating, gps } = useBarrio();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState(false);
  const [radius, setRadius] = useState(5);
  const [minRating, setMinRating] = useState(0);
  const [available, setAvailable] = useState(false);
  const found = useMemo(
    () => filterTechnicians(technicians, { query, category, radius, minRating, available, origin }),
    [technicians, query, category, radius, minRating, available, origin],
  );
  const reset = () => {
    setQuery('');
    setCategory('all');
    setRadius(5);
    setMinRating(0);
    setAvailable(false);
  };
  return (
    <div className="discover-page">
      <section className="welcome-line">
        <div>
          <p>
            Hola, {db.profile.name.split(' ')[0]} <span className="wave">✳</span>
          </p>
          <h1>
            El talento que necesitas,
            <br className="mobile-break" /> está en tu barrio.
          </h1>
        </div>
        <span className="local-tag">
          <span />
          Hecho para conectar vecinos
        </span>
      </section>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-label">
            <Icon icon={flashOutline} />
            SOLICITUD EXPRÉS
          </span>
          <h2>
            ¿Algo dejó de funcionar?
            <br />
            Tu barrio tiene la solución.
          </h2>
          <p>
            Cuéntanos qué necesitas y encuentra
            <br className="desktop-break" /> una mano experta cerca de ti.
          </p>
          <button onClick={onCreate} className="hero-button">
            {db.profile.role === 'technician' ? 'Ver oportunidades' : 'Pedir una mano'}
            <Icon icon={arrowForwardOutline} />
          </button>
          <span className="hero-note">Sin intermediarios. De vecino a vecino.</span>
        </div>
        <div className="neighborhood-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-cloud cloud-one" />
          <div className="art-cloud cloud-two" />
          <div className="art-hill" />
          <div className="house house-back">
            <div className="roof" />
            <i />
            <i />
            <span />
          </div>
          <div className="house house-front">
            <div className="roof" />
            <i />
            <i />
            <span />
          </div>
          <div className="tree">
            <span />
            <i />
          </div>
          <div className="art-badge badge-tool">
            <Icon icon={categoryIcons.construct || categoryIcons.soldadura} />
          </div>
          <div className="art-badge badge-heart">
            <Icon icon={peopleOutline} />
            <span>
              Nos ayudamos
              <br />
              <b>entre vecinos</b>
            </span>
          </div>
          <div className="art-path" />
        </div>
      </section>
      <section className="category-section" aria-label="Categorías de servicios">
        <div className="mini-heading">
          <h2>¿En qué te podemos ayudar?</h2>
          <span>Un experto para cada tarea</span>
        </div>
        <div className="category-list">
          {categories.map((c) => (
            <button
              className={`category-button ${category === c.id ? 'active' : ''}`}
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              <span>
                <Icon icon={categoryIcons[c.id]} />
              </span>
              <strong>{c.name}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="results-section">
        <div className="results-heading">
          <div>
            <span className="eyebrow">BUENAS MANOS, MUY CERCA</span>
            <h2>
              Expertos de tu barrio <span className="count-pill">{found.length}</span>
            </h2>
          </div>
          <div className="view-switch" role="group" aria-label="Vista de resultados">
            <button
              className={view === 'list' ? 'active' : ''}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <Icon icon={listOutline} />
              Lista
            </button>
            <button
              className={view === 'map' ? 'active' : ''}
              aria-pressed={view === 'map'}
              onClick={() => setView('map')}
            >
              <Icon icon={mapOutline} />
              Mapa
            </button>
          </div>
        </div>
        <div className="search-row">
          <label className="search-box">
            <Icon icon={searchOutline} />
            <input
              aria-label="Buscar técnico, oficio o barrio"
              placeholder="Busca un oficio, un nombre o tu barrio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                onClick={() => setQuery('')}
                aria-label="Borrar búsqueda"
              >
                <Icon icon={closeOutline} />
              </button>
            )}
          </label>
          <button
            className={`filter-button ${filters ? 'active' : ''}`}
            aria-expanded={filters}
            aria-controls="filter-panel"
            onClick={() => setFilters(!filters)}
          >
            <Icon icon={optionsOutline} />
            <span>Filtros</span>
            {(minRating > 0 || available || radius !== 5) && <i />}
          </button>
        </div>
        {filters && (
          <div className="filter-panel" id="filter-panel">
            <label>
              Distancia máxima
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {[1, 3, 5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} km
                  </option>
                ))}
              </select>
            </label>
            <label>
              Calificación
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value={0}>Todas las calificaciones</option>
                <option value={4}>4 estrellas o más</option>
                <option value={4.5}>4,5 estrellas o más</option>
                <option value={4.9}>4,9 estrellas o más</option>
              </select>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              Disponibles ahora
            </label>
            <button className="text-button" onClick={reset}>
              Restablecer
            </button>
          </div>
        )}
        <div className="search-meta">
          <span>
            {gps ? 'Cerca de tu ubicación' : 'Zona de referencia: Laureles, Medellín'} · hasta{' '}
            {radius} km
          </span>
          <button className="text-button" onClick={() => void getLocation()} disabled={locating}>
            <Icon icon={locateOutline} />
            {locating ? 'Ubicando…' : 'Usar mi ubicación'}
          </button>
        </div>
        {view === 'map' && (
          <Suspense fallback={<div className="map-loading">Cargando mapa…</div>}>
            <ServiceMap technicians={found} origin={origin} onSelect={onProfile} />
          </Suspense>
        )}
        {found.length ? (
          <div className="tech-grid">
            {found.map((t) => (
              <TechnicianCard
                key={t.id}
                technician={t}
                distance={t.distance}
                onOpen={() => onProfile(t.id)}
              />
            ))}
          </div>
        ) : (
          <Empty title="No encontramos técnicos con estos filtros">
            <p>Prueba otro oficio, amplía la distancia o restablece tu búsqueda.</p>
            <button className="secondary-button" onClick={reset}>
              Restablecer filtros
            </button>
          </Empty>
        )}
      </section>
      <section className="community-banner">
        <span className="community-icon">
          <Icon icon={shieldCheckmarkOutline} />
        </span>
        <div>
          <h3>Un barrio que se ayuda, crece.</h3>
          <p>Conecta directamente. Acuerda los detalles. Comparte tu experiencia.</p>
        </div>
        <span className="community-mark">
          BarrioRed <span>✳</span>
        </span>
      </section>
      <p className="demo-footer">
        Estás explorando una demo local · Perfiles y precios de ejemplo · Sin comisiones ni pagos
        integrados
      </p>
    </div>
  );
}
