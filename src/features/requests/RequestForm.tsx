import { useState, type FormEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  cameraOutline,
  imageOutline,
  locationOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { categories, type Category } from '../../domain/models';
import { readPhoto, takePhoto } from '../../platform/device';
import { useBarrio } from '../../state/BarrioProvider';
import { ErrorText, Icon } from '../../ui/components';
export function PhotoInput({
  photo,
  onChange,
}: {
  photo?: string;
  onChange: (value?: string) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handle = async (action: () => Promise<string | undefined>) => {
    setError('');
    setBusy(true);
    try {
      const value = await action();
      if (value) onChange(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir la imagen.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="photo-field">
      {photo ? (
        <div className="photo-preview">
          <img src={photo} alt="Fotografía adjunta" />
          <button type="button" className="text-button" onClick={() => onChange(undefined)}>
            Quitar imagen
          </button>
        </div>
      ) : (
        <>
          <label className={`photo-upload ${busy ? 'disabled' : ''}`}>
            <Icon icon={imageOutline} />
            <strong>{busy ? 'Procesando…' : 'Añadir una fotografía'}</strong>
            <span>Una imagen ayuda a explicar el trabajo · máximo 6 MB</span>
            <input
              disabled={busy}
              aria-label="Adjuntar fotografía"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handle(() => readPhoto(file));
                e.target.value = '';
              }}
            />
          </label>
          {Capacitor.isNativePlatform() && (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => void handle(takePhoto)}
            >
              <Icon icon={cameraOutline} /> Usar cámara
            </button>
          )}
        </>
      )}
      <ErrorText message={error} />
    </div>
  );
}
export function RequestForm({ onDone }: { onDone: () => void }) {
  const { db, createRequest, gps, getLocation, locating } = useBarrio();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('electricidad');
  const [zone, setZone] = useState(db.profile.zone);
  const [urgency, setUrgency] = useState<'today' | 'flexible'>('today');
  const [photo, setPhoto] = useState<string>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createRequest({ title, description, category, zone, urgency, photo });
      onDone();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo guardar. Verifica el espacio disponible.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <div className="form-intro">
        <span className="eyebrow">MANOS A LA OBRA</span>
        <h3>Cuéntanos qué necesitas.</h3>
        <p>Describe el trabajo para recibir una cotización más clara.</p>
      </div>
      <label>
        ¿Qué servicio buscas?
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {categories
            .filter((c) => c.id !== 'all')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Título de la solicitud
        <input
          required
          minLength={6}
          maxLength={90}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Necesito reparar un tomacorriente"
        />
      </label>
      <label>
        Descripción
        <textarea
          required
          minLength={15}
          maxLength={1000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿Qué sucede y qué te gustaría solucionar?"
        />
        <small>{description.length}/1.000 caracteres</small>
      </label>
      <PhotoInput photo={photo} onChange={setPhoto} />
      <fieldset>
        <legend>¿Cuándo lo necesitas?</legend>
        <div className="choice-row">
          <button
            type="button"
            aria-pressed={urgency === 'today'}
            className={urgency === 'today' ? 'chosen' : ''}
            onClick={() => setUrgency('today')}
          >
            Lo antes posible
          </button>
          <button
            type="button"
            aria-pressed={urgency === 'flexible'}
            className={urgency === 'flexible' ? 'chosen' : ''}
            onClick={() => setUrgency('flexible')}
          >
            Soy flexible
          </button>
        </div>
      </fieldset>
      <label>
        Barrio o sector
        <input
          required
          minLength={3}
          maxLength={80}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Ej. Laureles, Medellín"
        />
      </label>
      <button
        className="location-action"
        type="button"
        onClick={() => void getLocation()}
        disabled={locating}
      >
        <Icon icon={locationOutline} />
        {locating
          ? 'Buscando ubicación…'
          : gps
            ? 'Ubicación GPS lista · actualizar'
            : 'Usar mi ubicación · referencia actual: Medellín'}
      </button>
      <div className="privacy-note">
        <Icon icon={shieldCheckmarkOutline} />
        <p>
          Solo se guarda una zona aproximada. Comparte tu dirección exacta únicamente por contacto
          directo.
        </p>
      </div>
      <ErrorText message={error} />
      <button className="primary-button full" disabled={busy} type="submit">
        {busy ? 'Guardando…' : 'Publicar solicitud exprés'}
      </button>
      <p className="fine-print">
        Demostración local: esta solicitud no se envía a técnicos reales.
      </p>
    </form>
  );
}
