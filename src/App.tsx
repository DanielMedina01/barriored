import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { IonApp, IonContent, IonPage, IonToast } from '@ionic/react';
import {
  homeOutline,
  compassOutline,
  documentTextOutline,
  heartOutline,
  personOutline,
  locationOutline,
  notificationsOutline,
  arrowForwardOutline,
  flashOutline,
  wifiOutline,
} from 'ionicons/icons';
import { BarrioProvider, useBarrio } from './state/BarrioProvider';
import { Empty, Icon, Modal, TechnicianCard } from './ui/components';
import { distanceKm } from './domain/services';
import DiscoverPage from './features/discover/DiscoverPage';
import { RequestForm } from './features/requests/RequestForm';
import { TechnicianProfile } from './features/discover/TechnicianProfile';
const RequestsPage = lazy(() => import('./features/requests/RequestsPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const tabs = [
  { id: 'explore', name: 'Explorar', icon: compassOutline },
  { id: 'requests', name: 'Solicitudes', icon: documentTextOutline },
  { id: 'favorites', name: 'Favoritos', icon: heartOutline },
  { id: 'profile', name: 'Mi perfil', icon: personOutline },
] as const;
type Tab = (typeof tabs)[number]['id'];
const hashTab = (): Tab => tabs.find((t) => `#${t.id}` === window.location.hash)?.id ?? 'explore';
function Shell() {
  const {
    db,
    ready,
    error,
    online,
    notice,
    setNotice,
    technicians,
    origin,
    gps,
    getLocation,
    locating,
  } = useBarrio();
  const [tab, setTab] = useState<Tab>(hashTab);
  const [create, setCreate] = useState(false);
  const [profile, setProfile] = useState<string>();
  const onProfile = useCallback((id: string) => setProfile(id), []);
  const navigate = (value: Tab) => {
    window.location.hash = value;
    setTab(value);
  };
  useEffect(() => {
    const handler = () => setTab(hashTab());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const openRequest = () => {
    if (db.profile.role === 'technician') navigate('requests');
    else setCreate(true);
  };
  const selected = technicians.find((t) => t.id === profile);
  const replies = db.requests.filter((r) => r.status === 'open' && r.quotes.length).length;
  if (!ready)
    return (
      <IonPage>
        <IonContent>
          <div className="loading-screen">
            <span className="brand-icon">
              <Icon icon={homeOutline} />
            </span>
            <h1>BarrioRed</h1>
            <p role={error ? 'alert' : 'status'}>{error || 'Conectando con tu barrio…'}</p>
            {error && (
              <button className="secondary-button" onClick={() => window.location.reload()}>
                Volver a intentar
              </button>
            )}
          </div>
        </IonContent>
      </IonPage>
    );
  return (
    <IonPage>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate('explore')}
          aria-label="BarrioRed, inicio"
        >
          <span className="brand-icon">
            <Icon icon={homeOutline} />
          </span>
          <span>
            Barrio<span className="brand-red">Red</span>
            <small>EL TALENTO ESTÁ CERCA</small>
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => navigate(t.id)}
            >
              {t.name}
              {t.id === 'requests' && replies > 0 && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="header-location"
            onClick={() => void getLocation()}
            disabled={locating}
          >
            <Icon icon={locationOutline} />
            <span>
              <small>{gps ? 'GPS actualizado' : 'Zona de referencia'}</small>
              {locating ? 'Buscando…' : gps ? 'Mi ubicación' : 'Laureles, Medellín'}
            </span>
          </button>
          <button
            className="icon-button notification-button"
            aria-label={`Ver solicitudes, ${replies} con respuestas`}
            onClick={() => navigate('requests')}
          >
            <Icon icon={notificationsOutline} />
            {replies > 0 && <i />}
          </button>
          <button
            className="user-avatar"
            onClick={() => navigate('profile')}
            aria-label="Editar mi perfil"
          >
            {db.profile.name.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>
      {!online && (
        <div className="offline-bar" role="status">
          <Icon icon={wifiOutline} />
          Sin conexión. Puedes consultar y guardar datos en este dispositivo.
        </div>
      )}
      <IonContent key={tab} className="main-content">
        <main className="app-main">
          <Suspense
            fallback={
              <p className="page-loading" role="status">
                Cargando…
              </p>
            }
          >
            {tab === 'explore' && <DiscoverPage onCreate={openRequest} onProfile={onProfile} />}
            {tab === 'requests' && <RequestsPage onCreate={openRequest} onProfile={onProfile} />}
            {tab === 'profile' && <ProfilePage />}
            {tab === 'favorites' && (
              <div className="page-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">LA CONFIANZA SE GUARDA</span>
                    <h1>Mis favoritos</h1>
                    <p>Ten siempre a mano a los expertos de tu barrio.</p>
                  </div>
                </div>
                {db.favorites.length ? (
                  <div className="tech-grid">
                    {technicians
                      .filter((t) => db.favorites.includes(t.id))
                      .map((t) => (
                        <TechnicianCard
                          key={t.id}
                          technician={t}
                          distance={distanceKm(origin, t.location)}
                          onOpen={() => onProfile(t.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <Empty title="Aquí empieza tu red de confianza">
                    <p>
                      Toca el corazón de un perfil para guardarlo y encontrarlo fácilmente después.
                    </p>
                    <button className="primary-button" onClick={() => navigate('explore')}>
                      Explorar técnicos
                      <Icon icon={arrowForwardOutline} />
                    </button>
                  </Empty>
                )}
              </div>
            )}
          </Suspense>
        </main>
      </IonContent>
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => navigate(t.id)}
          >
            <span>
              <Icon icon={t.icon} />
              {t.id === 'requests' && replies > 0 && <i className="nav-dot" />}
            </span>
            {t.name}
          </button>
        ))}
      </nav>
      {tab === 'explore' && db.profile.role === 'client' && (
        <button className="mobile-fab" aria-label="Crear solicitud exprés" onClick={openRequest}>
          <Icon icon={flashOutline} />
        </button>
      )}
      <Modal title="Nueva solicitud exprés" open={create} close={() => setCreate(false)}>
        <RequestForm
          onDone={() => {
            setCreate(false);
            navigate('requests');
          }}
        />
      </Modal>
      <Modal title="Tu experto del barrio" open={!!selected} close={() => setProfile(undefined)}>
        {selected && (
          <TechnicianProfile
            technician={selected}
            onRequest={() => {
              setProfile(undefined);
              setCreate(true);
            }}
          />
        )}
      </Modal>
      <IonToast
        isOpen={!!notice}
        message={notice}
        duration={6000}
        onDidDismiss={() => setNotice('')}
        position="top"
        buttons={[{ text: 'Cerrar', role: 'cancel' }]}
      />
    </IonPage>
  );
}
export default function App() {
  return (
    <IonApp>
      <BarrioProvider>
        <Shell />
      </BarrioProvider>
    </IonApp>
  );
}
