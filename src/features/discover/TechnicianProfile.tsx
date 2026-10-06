import {
  callOutline,
  logoWhatsapp,
  star,
  locationOutline,
  shieldCheckmarkOutline,
  briefcaseOutline,
} from 'ionicons/icons';
import { categoryName, currency, type Technician } from '../../domain/models';
import { useBarrio } from '../../state/BarrioProvider';
import { Avatar, Icon } from '../../ui/components';
export function TechnicianProfile({
  technician: t,
  onRequest,
}: {
  technician: Technician;
  onRequest: () => void;
}) {
  const { db, setNotice } = useBarrio();
  const phone = t.phone?.replace(/\D/g, '');
  const normalizedPhone = phone?.length === 10 ? `57${phone}` : phone;
  const contact = (kind: 'phone' | 'whatsapp') => {
    if (!normalizedPhone) {
      setNotice(
        'Este es un perfil de ejemplo y no tiene un teléfono real. Puedes probar el flujo con una solicitud exprés.',
      );
      return;
    }
    const url =
      kind === 'phone'
        ? `tel:+${normalizedPhone}`
        : `https://wa.me/${normalizedPhone}?text=${encodeURIComponent('Hola, vi tu perfil en BarrioRed. Me gustaría consultar por un servicio.')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const reviews = db.reviews.filter((r) => r.technicianId === t.id);
  return (
    <div className="profile-detail">
      <div className="profile-hero">
        <Avatar technician={t} large />
        <span className="trade-label">{categoryName(t.category)}</span>
        <h2>{t.name}</h2>
        <p>
          <Icon icon={locationOutline} />
          {t.zone} · Medellín
        </p>
        <span className="rating">
          <Icon icon={star} />
          <strong>{t.rating.toFixed(1)}</strong>
          <span>({t.reviewCount} valoraciones)</span>
        </span>
      </div>
      <div className="profile-stats">
        <div>
          <strong>{t.jobs}</strong>
          <span>Trabajos</span>
        </div>
        <div>
          <strong>{t.experience || '—'}</strong>
          <span>Años de experiencia</span>
        </div>
        <div>
          <strong>{t.available ? 'Sí' : 'Consultar'}</strong>
          <span>Disponible</span>
        </div>
      </div>
      <section>
        <h3>Conoce a tu técnico</h3>
        <p>{t.bio}</p>
      </section>
      <div className="price-box">
        <Icon icon={briefcaseOutline} />
        <div>
          <span>Visita de diagnóstico desde</span>
          <strong>{t.price ? currency(t.price) : 'A convenir'}</strong>
        </div>
        <small>Confirma el precio final antes de contratar.</small>
      </div>
      <section>
        <h3>Portafolio</h3>
        {t.portfolio.length ? (
          <div className="portfolio-grid">
            {t.portfolio.map((src, i) => (
              <img key={i} src={src} alt={`Trabajo realizado ${i + 1}`} />
            ))}
          </div>
        ) : (
          <p className="muted">Este perfil aún no tiene fotografías de trabajos.</p>
        )}
      </section>
      <section>
        <h3>Reseñas de la comunidad</h3>
        {reviews.length ? (
          reviews.map((r) => (
            <article className="review" key={r.id}>
              <strong>{r.author}</strong>
              <span className="rating">{'★'.repeat(r.rating)}</span>
              <p>{r.comment}</p>
            </article>
          ))
        ) : (
          <p className="muted">
            Las puntuaciones iniciales son datos de ejemplo. Las reseñas que crees aparecerán aquí.
          </p>
        )}
      </section>
      <div className="privacy-note">
        <Icon icon={shieldCheckmarkOutline} />
        <p>
          {t.id.startsWith('local')
            ? 'Perfil guardado localmente. La identidad no ha sido verificada.'
            : 'Perfil de demostración. Los nombres, trabajos y valoraciones son ilustrativos.'}
        </p>
      </div>
      <div className="contact-buttons">
        <button className="primary-button" onClick={() => contact('whatsapp')}>
          <Icon icon={logoWhatsapp} />
          WhatsApp
        </button>
        <button className="secondary-button" onClick={() => contact('phone')}>
          <Icon icon={callOutline} />
          Llamar
        </button>
      </div>
      {db.profile.role === 'client' && (
        <button className="text-button full" onClick={onRequest}>
          Prefiero publicar una solicitud exprés
        </button>
      )}
    </div>
  );
}
