import { useState, type FormEvent } from 'react';
import {
  personOutline,
  constructOutline,
  shieldCheckmarkOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { categories } from '../../domain/models';
import { useBarrio } from '../../state/BarrioProvider';
import { ErrorText, Icon } from '../../ui/components';
import { PhotoInput } from '../requests/RequestForm';
export default function ProfilePage() {
  const { db, saveProfile } = useBarrio();
  const [profile, setProfile] = useState(db.profile);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveProfile(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el perfil.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-section narrow-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TU ESPACIO EN EL BARRIO</span>
          <h1>Mi perfil</h1>
          <p>Conecta desde lo que necesitas o lo que sabes hacer.</p>
        </div>
      </div>
      <div className="demo-callout">
        <Icon icon={shieldCheckmarkOutline} />
        <div>
          <strong>Estás en modo demostración</strong>
          <p>
            Tu perfil se guarda solo en este dispositivo. No es una cuenta autenticada ni se
            comparte por internet.
          </p>
        </div>
      </div>
      <form className="form-stack profile-form" onSubmit={submit}>
        <fieldset>
          <legend>¿Cómo quieres usar BarrioRed?</legend>
          <div className="role-options">
            <button
              type="button"
              className={profile.role === 'client' ? 'chosen' : ''}
              aria-pressed={profile.role === 'client'}
              onClick={() => setProfile({ ...profile, role: 'client' })}
            >
              <Icon icon={personOutline} />
              <strong>Soy vecino</strong>
              <span>Busco una mano experta</span>
            </button>
            <button
              type="button"
              className={profile.role === 'technician' ? 'chosen' : ''}
              aria-pressed={profile.role === 'technician'}
              onClick={() => setProfile({ ...profile, role: 'technician' })}
            >
              <Icon icon={constructOutline} />
              <strong>Soy técnico</strong>
              <span>Ofrezco mis servicios</span>
            </button>
          </div>
        </fieldset>
        <label>
          Nombre completo
          <input
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </label>
        <label>
          Correo electrónico <span className="optional">(opcional en demo)</span>
          <input
            type="email"
            autoComplete="email"
            maxLength={150}
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="tu@correo.com"
          />
        </label>
        <label>
          Barrio o zona
          <input
            required
            minLength={3}
            maxLength={80}
            value={profile.zone}
            onChange={(e) => setProfile({ ...profile, zone: e.target.value })}
          />
        </label>
        {profile.role === 'technician' && (
          <>
            <label>
              Oficio principal
              <select
                value={profile.category}
                onChange={(e) =>
                  setProfile({ ...profile, category: e.target.value as typeof profile.category })
                }
              >
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
              Sobre tu trabajo
              <textarea
                rows={4}
                required
                minLength={15}
                maxLength={1000}
                placeholder="Cuéntale a tu barrio qué sabes hacer…"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </label>
            <label>
              Celular de contacto
              <input
                type="tel"
                autoComplete="tel"
                maxLength={18}
                placeholder="300 123 4567"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>Fotografías de tus trabajos (máximo 4)</legend>
              <div className="portfolio-grid">
                {profile.portfolio.map((src, i) => (
                  <div key={i}>
                    <img src={src} alt={`Trabajo ${i + 1}`} />
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          portfolio: profile.portfolio.filter((_, index) => index !== i),
                        })
                      }
                    >
                      Quitar foto {i + 1}
                    </button>
                  </div>
                ))}
              </div>
              {profile.portfolio.length < 4 && (
                <PhotoInput
                  onChange={(photo) => {
                    if (photo) setProfile({ ...profile, portfolio: [...profile.portfolio, photo] });
                  }}
                />
              )}
            </fieldset>
          </>
        )}
        <ErrorText message={error} />
        <button className="primary-button" disabled={busy}>
          <Icon icon={checkmarkCircleOutline} />
          {busy ? 'Guardando…' : 'Guardar mi perfil'}
        </button>
        <p className="fine-print">
          Puedes cambiar de rol para probar ambos lados del servicio. Guarda los cambios para
          aplicarlos.
        </p>
      </form>
    </div>
  );
}
