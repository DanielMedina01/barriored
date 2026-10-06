import { useState, type FormEvent } from 'react';
import {
  addOutline,
  arrowForwardOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  flashOutline,
  locationOutline,
  star,
} from 'ionicons/icons';
import { categoryName, currency, type ServiceRequest } from '../../domain/models';
import { useBarrio } from '../../state/BarrioProvider';
import { categoryIcons, Empty, ErrorText, Icon, Modal } from '../../ui/components';
const statusLabel = {
  open: 'Buscando técnico',
  accepted: 'En curso',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};
function ReviewForm({ request, onDone }: { request: ServiceRequest; onDone: () => void }) {
  const { review } = useBarrio();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await review(request.id, rating, comment);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-intro">
        <h3>¿Cómo estuvo el servicio?</h3>
        <p>Tu experiencia ayuda a otros vecinos a elegir.</p>
      </div>
      <div className="star-picker" role="group" aria-label="Calificación de 1 a 5 estrellas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            aria-label={`${n} estrellas`}
            aria-pressed={n === rating}
            className={n <= rating ? 'active' : ''}
            key={n}
            onClick={() => setRating(n)}
          >
            <Icon icon={star} />
          </button>
        ))}
      </div>
      <label>
        Tu experiencia
        <textarea
          required
          minLength={5}
          maxLength={500}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos sobre la atención y el trabajo…"
        />
      </label>
      <ErrorText message={error} />
      <button className="primary-button" disabled={busy || rating === 0}>
        {busy ? 'Guardando…' : 'Publicar reseña'}
      </button>
    </form>
  );
}
function RequestDetail({
  request: r,
  onProfile,
}: {
  request: ServiceRequest;
  onProfile: (id: string) => void;
}) {
  const { db, quote, accept, finish } = useBarrio();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const technician = db.profile.role === 'technician';
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la acción.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="request-detail form-stack">
      <span className={`status-badge ${r.status}`}>{statusLabel[r.status]}</span>
      <h3>{r.title}</h3>
      <p className="request-description">{r.description}</p>
      <p className="location-line">
        <Icon icon={locationOutline} />
        {r.zone} · Zona aproximada
      </p>
      <div className="request-tags">
        <span>{categoryName(r.category)}</span>
        <span>{r.urgency === 'today' ? 'Lo antes posible' : 'Horario flexible'}</span>
      </div>
      {r.photo && <img className="request-photo" src={r.photo} alt="Fotografía de la solicitud" />}
      <ErrorText message={error} />
      <section>
        <h3>{r.quotes.length ? `Cotizaciones (${r.quotes.length})` : 'Aún no hay cotizaciones'}</h3>
        {r.quotes.map((q) => (
          <article
            className={`quote-card ${r.acceptedQuoteId === q.id ? 'accepted' : ''}`}
            key={q.id}
          >
            <div className="quote-heading">
              <button className="text-button" onClick={() => onProfile(q.technicianId)}>
                {q.name}
                <Icon icon={arrowForwardOutline} />
              </button>
              <strong>{currency(q.amount)}</strong>
            </div>
            <p>{q.message}</p>
            {r.acceptedQuoteId === q.id && (
              <span className="accepted-label">
                <Icon icon={checkmarkCircleOutline} />
                Cotización elegida
              </span>
            )}
            {!technician && r.status === 'open' && (
              <button
                className="secondary-button full"
                disabled={busy}
                onClick={() => void run(() => accept(r.id, q.id))}
              >
                Elegir esta cotización
              </button>
            )}
          </article>
        ))}
        {!r.quotes.length && (
          <p className="muted">
            En una versión conectada, las respuestas de los técnicos aparecerán aquí.
          </p>
        )}
      </section>
      {r.status === 'open' &&
        technician &&
        !r.quotes.some((q) => q.technicianId === 'local-technician') && (
          <form
            className="form-stack quote-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => quote(r.id, Number(amount), message));
            }}
          >
            <h3>Ofrece tu ayuda</h3>
            <label>
              Valor de tu cotización (COP)
              <input
                required
                type="number"
                min={1000}
                max={100000000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45000"
              />
            </label>
            <label>
              Mensaje para el vecino
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¿Qué incluye y cuándo puedes atender?"
              />
            </label>
            <button className="primary-button" disabled={busy}>
              Enviar cotización local
            </button>
          </form>
        )}
      {r.status === 'open' && !technician && (
        <>
          <div className="demo-callout">
            <Icon icon={chatbubbleEllipsesOutline} />
            <div>
              <strong>Prueba el recorrido completo</strong>
              <p>
                Añade una respuesta ficticia para explorar la contratación, o cambia al rol técnico
                y cotiza tú mismo.
              </p>
              <button
                className="text-button"
                disabled={busy || r.quotes.some((q) => q.technicianId.startsWith('t'))}
                onClick={() =>
                  void run(() =>
                    quote(
                      r.id,
                      45000,
                      'Respuesta de ejemplo: puedo revisar el trabajo y acordar contigo el horario. El valor incluye la visita de diagnóstico.',
                      true,
                    ),
                  )
                }
              >
                Añadir cotización de ejemplo
              </button>
            </div>
          </div>
          {cancelConfirm ? (
            <div className="confirmation">
              <p>¿Cancelar esta solicitud? Dejará de recibir cotizaciones.</p>
              <div className="choice-row">
                <button
                  className="danger-button"
                  disabled={busy}
                  onClick={() => void run(() => finish(r.id, 'cancelled'))}
                >
                  Sí, cancelar
                </button>
                <button className="secondary-button" onClick={() => setCancelConfirm(false)}>
                  Volver
                </button>
              </div>
            </div>
          ) : (
            <button className="text-button danger" onClick={() => setCancelConfirm(true)}>
              Cancelar solicitud
            </button>
          )}
        </>
      )}
      {r.status === 'accepted' && !technician && (
        <button
          className="primary-button"
          disabled={busy}
          onClick={() => void run(() => finish(r.id, 'completed'))}
        >
          <Icon icon={checkmarkCircleOutline} />
          Marcar servicio como finalizado
        </button>
      )}
      {r.status === 'completed' &&
        !technician &&
        (db.reviews.some((review) => review.requestId === r.id) ? (
          <div className="privacy-note">
            <Icon icon={checkmarkCircleOutline} />
            <p>Ya compartiste tu experiencia. ¡Gracias!</p>
          </div>
        ) : (
          <button className="primary-button" onClick={() => setRatingOpen(true)}>
            <Icon icon={star} />
            Calificar el servicio
          </button>
        ))}
      <Modal title="Tu opinión cuenta" open={ratingOpen} close={() => setRatingOpen(false)}>
        <ReviewForm request={r} onDone={() => setRatingOpen(false)} />
      </Modal>
    </div>
  );
}
export default function RequestsPage({
  onCreate,
  onProfile,
}: {
  onCreate: () => void;
  onProfile: (id: string) => void;
}) {
  const { db } = useBarrio();
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState<string>();
  const technician = db.profile.role === 'technician';
  const requests = db.requests
    .filter(
      (r) =>
        !technician ||
        r.category === db.profile.category ||
        r.quotes.some((q) => q.technicianId === 'local-technician'),
    )
    .filter(
      (r) =>
        filter === 'all' ||
        (filter === 'active'
          ? r.status === 'open' || r.status === 'accepted'
          : r.status === 'completed' || r.status === 'cancelled'),
    );
  const current = db.requests.find((r) => r.id === selected);
  return (
    <div className="page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CADA SOLUCIÓN EMPIEZA AQUÍ</span>
          <h1>{technician ? 'Oportunidades del barrio' : 'Mis solicitudes'}</h1>
          <p>
            {technician
              ? 'Solicitudes locales de tu oficio y trabajos que has cotizado.'
              : 'Sigue tus solicitudes y encuentra la ayuda que necesitas.'}
          </p>
        </div>
        {!technician && (
          <button className="primary-button" onClick={onCreate}>
            <Icon icon={addOutline} />
            Nueva solicitud
          </button>
        )}
      </div>
      <div className="request-filters" role="group" aria-label="Filtrar solicitudes">
        {[
          ['active', 'Activas'],
          ['history', 'Historial'],
          ['all', 'Todas'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? 'active' : ''}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {requests.length ? (
        <div className="request-grid">
          {requests.map((r) => (
            <button className="request-card" key={r.id} onClick={() => setSelected(r.id)}>
              <div className="request-card-top">
                <span className="request-category-icon">
                  <Icon icon={categoryIcons[r.category]} />
                </span>
                <span className={`status-badge ${r.status}`}>{statusLabel[r.status]}</span>
              </div>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <span className="location-line">
                <Icon icon={locationOutline} />
                {r.zone}
              </span>
              <footer>
                <span>
                  <Icon icon={chatbubbleEllipsesOutline} />
                  {r.quotes.length} cotizaciones
                </span>
                <span>
                  {new Date(r.createdAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                  })}
                  <Icon icon={arrowForwardOutline} />
                </span>
              </footer>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title={
            technician
              ? 'Tu próxima oportunidad está por llegar'
              : 'Una mano experta empieza con una solicitud'
          }
        >
          <p>
            {technician
              ? 'Todavía no hay solicitudes de tu oficio. En esta demo puedes crear una como vecino y volver al perfil técnico.'
              : 'Cuéntale al barrio qué necesitas y lleva el seguimiento desde aquí.'}
          </p>
          {!technician && (
            <button className="primary-button" onClick={onCreate}>
              <Icon icon={flashOutline} />
              Crear solicitud exprés
            </button>
          )}
        </Empty>
      )}
      <Modal title="Detalle de la solicitud" open={!!current} close={() => setSelected(undefined)}>
        {current && <RequestDetail key={current.id} request={current} onProfile={onProfile} />}
      </Modal>
    </div>
  );
}
