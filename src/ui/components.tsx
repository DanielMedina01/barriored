import { IonIcon, IonModal } from '@ionic/react';
import {
  appsOutline,
  flashOutline,
  waterOutline,
  carSportOutline,
  keyOutline,
  constructOutline,
  cubeOutline,
  closeOutline,
  star,
  heart,
  heartOutline,
  arrowForwardOutline,
  locationOutline,
} from 'ionicons/icons';
import type { ReactNode } from 'react';
import { categoryName, currency, type Technician } from '../domain/models';
import { useBarrio } from '../state/BarrioProvider';
export const categoryIcons: Record<string, string> = {
  all: appsOutline,
  electricidad: flashOutline,
  plomeria: waterOutline,
  mecanica: carSportOutline,
  cerrajeria: keyOutline,
  soldadura: constructOutline,
  carga: cubeOutline,
};
export const Icon = ({ icon, ...props }: { icon: string; className?: string }) => (
  <IonIcon icon={icon} aria-hidden="true" {...props} />
);
export function Modal({
  title,
  open,
  close,
  children,
}: {
  title: string;
  open: boolean;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <IonModal isOpen={open} onDidDismiss={close} className="app-modal" aria-label={title}>
      <div className="modal-layout">
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Cerrar">
            <Icon icon={closeOutline} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </IonModal>
  );
}
export function Avatar({ technician, large = false }: { technician: Technician; large?: boolean }) {
  return (
    <div className={`avatar ${technician.color} ${large ? 'large' : ''}`} aria-hidden="true">
      <span>{technician.initials}</span>
      <i>
        <Icon icon={categoryIcons[technician.category]} />
      </i>
    </div>
  );
}
export function TechnicianCard({
  technician: t,
  distance,
  onOpen,
}: {
  technician: Technician;
  distance: number;
  onOpen: () => void;
}) {
  const { db, toggleFavorite, setNotice } = useBarrio();
  const favorite = db.favorites.includes(t.id);
  return (
    <article className="tech-card">
      <div className="tech-top">
        <Avatar technician={t} />
        <span className={`availability ${t.available ? '' : 'busy'}`}>
          <b />
          {t.available ? 'Disponible' : 'Con agenda'}
        </span>
        <button
          className={`icon-button favorite ${favorite ? 'selected' : ''}`}
          aria-label={`${favorite ? 'Quitar de' : 'Añadir a'} favoritos a ${t.name}`}
          aria-pressed={favorite}
          onClick={() => void toggleFavorite(t.id).catch((e) => setNotice(e.message))}
        >
          <Icon icon={favorite ? heart : heartOutline} />
        </button>
      </div>
      <button className="tech-main" onClick={onOpen}>
        <span className="trade-label">{categoryName(t.category)}</span>
        <h3>{t.name}</h3>
        <span className="rating">
          <Icon icon={star} />
          <strong>{t.rating.toFixed(1)}</strong>
          <span>({t.reviewCount} reseñas)</span>
        </span>
        <p>
          <Icon icon={locationOutline} />
          {t.zone}
          <span className="dot">·</span>
          {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
        </p>
      </button>
      <footer>
        <span>
          Visita desde <strong>{currency(t.price)}</strong>
        </span>
        <button className="round-arrow" onClick={onOpen} aria-label={`Ver perfil de ${t.name}`}>
          <Icon icon={arrowForwardOutline} />
        </button>
      </footer>
    </article>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon icon={constructOutline} />
      </span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="form-error">
      {message}
    </p>
  ) : null;
}
