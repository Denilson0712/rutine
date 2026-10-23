import { useEffect, useRef, useState } from 'react';
import PanelLayout from '../../components/panel/PanelLayout.jsx';
import TrainerAvatar from '../../components/gym/TrainerAvatar.jsx';
import Field from '../../components/ui/Field.jsx';
import FormNotice from '../../components/ui/FormNotice.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useAsync, ProfileSkeleton, ProfileMissing } from '../GymProfilePage.jsx';
import { Link, buildPath, navigate, useLocation, ROUTES } from '../../lib/router.jsx';
import { WEEKDAYS } from '../../lib/gymFormat.js';
import { emptyTrainer, validateTrainer, validatePhoto, normalizeSpecialty, MAX_SPECIALTIES } from '../../lib/trainerValidation.js';
import { getPanelGym, panelIsDemo, saveTrainer } from '../../services/panelTrainers.js';

const SUGGESTED = ['Musculación', 'Fuerza', 'Funcional', 'Acondicionamiento físico', 'HIIT', 'Movilidad', 'Spinning', 'Yoga', 'Pilates', 'Boxeo', 'Principiantes', 'Adultos mayores'];

let tmp = 0;
const tmpId = () => `new-${(tmp += 1)}`;

function toForm(t) {
  if (!t) return emptyTrainer();
  return {
    full_name: t.full_name,
    headline: t.headline || '',
    bio: t.bio || '',
    specialties: [...t.specialties],
    experience_years: t.experience_years ?? '',
    is_public: t.is_public,
    status: t.status,
    location_ids: [...t.location_ids],
    availability: t.availability.map((a) => ({ ...a, key: tmpId() })),
    certifications: t.certifications.map((c) => ({ ...c, issuer: c.issuer || '', year: c.year ?? '', verified: Boolean(c.verified_at), key: c.id })),
    photo_path: t.photo_path,
  };
}

export default function PanelTrainerEditPage({ params }) {
  const isNew = params.trainerId === 'nuevo';
  const { status, data: gym, error } = useAsync(() => getPanelGym(params.gymId), [params.gymId, params.trainerId]);
  const trainer = gym && !isNew ? gym.trainers.find((t) => t.id === params.trainerId) : null;

  if (status === 'loading') return <ProfileSkeleton />;
  if (status === 'error') return <ProfileMissing title="No se pudo cargar el entrenador" text={error.message} />;
  if (!gym || (!isNew && !trainer)) return <ProfileMissing title="Entrenador no encontrado" text="Puede que no pertenezca a este gimnasio." />;

  return (
    <PanelLayout gym={gym} active="entrenadores" isDemo={panelIsDemo}>
      <TrainerForm key={params.trainerId} gym={gym} trainer={trainer} isNew={isNew} />
    </PanelLayout>
  );
}

function TrainerForm({ gym, trainer, isNew }) {
  const editable = gym.isDemo || gym.editable;
  const { searchParams } = useLocation();
  const justCreated = searchParams.get('creado') === '1';
  const [form, setForm] = useState(() => toForm(trainer));
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null); // { file, preview } | { remove: true }
  const [photoError, setPhotoError] = useState(null);
  const [specInput, setSpecInput] = useState('');
  const [status, setStatus] = useState(justCreated ? 'saved' : 'idle');
  const [message, setMessage] = useState(justCreated ? (panelIsDemo ? 'Registrado solo en esta pestaña (modo demostración).' : 'El entrenador ya está registrado.') : '');
  const noticeRef = useRef(null);
  const formRef = useRef(null);
  const listHref = buildPath(ROUTES.panelTrainers, { gymId: gym.id });

  useEffect(() => () => { if (photo?.preview) URL.revokeObjectURL(photo.preview); }, [photo]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addSpecialty = (text) => {
    const s = normalizeSpecialty(text);
    if (!s || form.specialties.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    if (form.specialties.length >= MAX_SPECIALTIES) {
      setErrors((e) => ({ ...e, specialties: `Máximo ${MAX_SPECIALTIES} especialidades.` }));
      return;
    }
    set('specialties', [...form.specialties, s]);
    setSpecInput('');
  };

  const toggleLocation = (id) => {
    const on = form.location_ids.includes(id);
    setForm((f) => ({
      ...f,
      location_ids: on ? f.location_ids.filter((x) => x !== id) : [...f.location_ids, id],
      // Quitar una sede elimina también sus franjas, para no dejar horarios huérfanos.
      availability: on ? f.availability.filter((a) => a.location_id !== id) : f.availability,
    }));
  };

  const updateList = (key, index, patch) =>
    setForm((f) => ({ ...f, [key]: f[key].map((x, i) => (i === index ? { ...x, ...patch } : x)) }));
  const removeFromList = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));

  const onPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const err = validatePhoto(file);
    setPhotoError(err);
    if (!file || err) return;
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validateTrainer(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus('invalid');
      requestAnimationFrame(() => (formRef.current?.querySelector('[aria-invalid="true"]') || noticeRef.current)?.focus());
      return;
    }
    setStatus('saving');
    try {
      const id = await saveTrainer(gym.id, isNew ? null : trainer.id, form, photo);
      setStatus('saved');
      setMessage(panelIsDemo ? 'Guardado solo en esta pestaña (modo demostración).' : 'Los cambios ya están guardados.');
      if (isNew) {
        navigate(`${buildPath(ROUTES.panelTrainerEdit, { gymId: gym.id, trainerId: id })}?creado=1`, { replace: true });
        return;
      }
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  const previewTrainer = {
    full_name: form.full_name || 'Nuevo entrenador',
    photo_path: photo?.remove ? null : photo?.preview || form.photo_path,
  };
  const publicHref = trainer && trainer.is_public && trainer.status === 'active' && (gym.isDemo || gym.affiliation_status === 'approved')
    ? buildPath(ROUTES.trainerProfile, { slug: gym.slug, trainer: trainer.slug }) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="trainer-form">
      <header className="panel-header">
        <div>
          <Link to={listHref} className="back-link"><Icon name="back" size={18} />Entrenadores</Link>
          <h1>{isNew ? 'Registrar entrenador' : form.full_name || 'Editar entrenador'}</h1>
        </div>
        <div className="hero-actions">
          {publicHref && <Link to={publicHref} className="btn btn--ghost">Ver perfil público</Link>}
          {editable && (
            <button type="submit" className="btn btn--primary" disabled={status === 'saving'}>
              {status === 'saving' ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>
      </header>

      {status === 'saved' && <FormNotice innerRef={noticeRef} tone="ok" title="Entrenador guardado">{message}</FormNotice>}
      {status === 'error' && <FormNotice innerRef={noticeRef} tone="error" title="No se pudo guardar">{message}</FormNotice>}
      {status === 'invalid' && <FormNotice innerRef={noticeRef} tone="error" title="Revisa los campos marcados" />}

      <fieldset disabled={!editable} className="form-sections">
        <section className="form-card" aria-labelledby="s-datos">
          <h2 id="s-datos">Datos del perfil</h2>
          <div className="photo-row">
            <TrainerAvatar trainer={previewTrainer} size="md" />
            <div className="photo-actions">
              <label className="btn btn--ghost btn--small file-btn">
                <Icon name="upload" size={16} />{previewTrainer.photo_path ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="visually-hidden" />
              </label>
              {previewTrainer.photo_path && (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setPhoto({ remove: true })}>Quitar foto</button>
              )}
              <p className="field-hint">Foto real del entrenador, con su permiso. JPG, PNG o WebP, máximo 5 MB.</p>
              {photoError && <p className="field-error" role="alert">{photoError}</p>}
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nombre completo" error={errors.full_name}>
              <input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} maxLength={100} autoComplete="off" />
            </Field>
            <Field label="Años de experiencia" optional error={errors.experience_years}>
              <input type="number" inputMode="numeric" min="0" max="60" value={form.experience_years} onChange={(e) => set('experience_years', e.target.value)} />
            </Field>
            <Field label="Frase de presentación" optional error={errors.headline} hint="Ej.: Fuerza y técnica de levantamiento" className="field--full">
              <input type="text" value={form.headline} onChange={(e) => set('headline', e.target.value)} maxLength={120} />
            </Field>
            <Field label="Descripción profesional" optional error={errors.bio} hint={`${form.bio.length}/1500`} className="field--full">
              <textarea rows={5} value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={1500} />
            </Field>
          </div>

          <div className={`field ${errors.specialties ? 'field--error' : ''}`}>
            <label htmlFor="spec-input">Especialidades <span className="optional">(hasta {MAX_SPECIALTIES})</span></label>
            {form.specialties.length > 0 && (
              <ul className="tags tags--edit">
                {form.specialties.map((s) => (
                  <li key={s}>{s}
                    <button type="button" aria-label={`Quitar ${s}`} onClick={() => set('specialties', form.specialties.filter((x) => x !== s))}><Icon name="close" size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inline-add">
              <input id="spec-input" type="text" value={specInput} onChange={(e) => setSpecInput(e.target.value)} placeholder="Escribe y pulsa Añadir"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(specInput); } }} maxLength={40} />
              <button type="button" className="btn btn--ghost" onClick={() => addSpecialty(specInput)}>Añadir</button>
            </div>
            <div className="chips chips--sm" aria-label="Sugerencias">
              {SUGGESTED.filter((s) => !form.specialties.includes(s)).map((s) => (
                <button key={s} type="button" className="chip" onClick={() => addSpecialty(s)}>+ {s}</button>
              ))}
            </div>
            {errors.specialties && <span className="field-error">{errors.specialties}</span>}
          </div>
        </section>

        <section className="form-card" aria-labelledby="s-sedes">
          <h2 id="s-sedes">Sedes donde trabaja</h2>
          {gym.locations.length === 0 ? (
            <p className="muted">Registra primero una sede del gimnasio.</p>
          ) : (
            <ul className="check-list">
              {gym.locations.map((l) => (
                <li key={l.id}>
                  <label className="check-row">
                    <input type="checkbox" checked={form.location_ids.includes(l.id)} onChange={() => toggleLocation(l.id)} />
                    <span><strong>{l.name}</strong><small>{[l.address, l.city].filter(Boolean).join(', ')}</small></span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="form-card" aria-labelledby="s-disp">
          <div className="section-row">
            <h2 id="s-disp">Horarios y disponibilidad</h2>
            <button type="button" className="btn btn--ghost btn--small" disabled={form.location_ids.length === 0}
              onClick={() => set('availability', [...form.availability, { key: tmpId(), location_id: form.location_ids[0], weekday: 1, starts_at: '08:00', ends_at: '12:00' }])}>
              <Icon name="plus" size={16} />Añadir franja
            </button>
          </div>
          {form.location_ids.length === 0 && <p className="muted">Asigna al menos una sede para configurar horarios.</p>}
          {form.availability.length === 0 && form.location_ids.length > 0 && <p className="muted">Sin franjas. El perfil indicará que la disponibilidad no está publicada.</p>}
          <ul className="slot-list">
            {form.availability.map((a, i) => (
              <li key={a.key} className={`slot-row ${errors.availability?.[i] ? 'field--error' : ''}`}>
                <label><span className="visually-hidden">Sede</span>
                  <select value={a.location_id} onChange={(e) => updateList('availability', i, { location_id: e.target.value })}>
                    {gym.locations.filter((l) => form.location_ids.includes(l.id)).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </label>
                <label><span className="visually-hidden">Día</span>
                  <select value={a.weekday} onChange={(e) => updateList('availability', i, { weekday: Number(e.target.value) })}>
                    {WEEKDAYS.map((d, n) => <option key={d} value={n + 1}>{d}</option>)}
                  </select>
                </label>
                <label><span className="visually-hidden">Desde</span>
                  <input type="time" value={a.starts_at} onChange={(e) => updateList('availability', i, { starts_at: e.target.value })} />
                </label>
                <label><span className="visually-hidden">Hasta</span>
                  <input type="time" value={a.ends_at} onChange={(e) => updateList('availability', i, { ends_at: e.target.value })} />
                </label>
                <button type="button" className="icon-btn" aria-label="Quitar franja" onClick={() => removeFromList('availability', i)}><Icon name="trash" size={18} /></button>
                {errors.availability?.[i] && <span className="field-error slot-error">{errors.availability[i]}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="form-card" aria-labelledby="s-cert">
          <div className="section-row">
            <h2 id="s-cert">Experiencia y certificaciones</h2>
            <button type="button" className="btn btn--ghost btn--small"
              onClick={() => set('certifications', [...form.certifications, { key: tmpId(), id: null, name: '', issuer: '', year: '', verified: false }])}>
              <Icon name="plus" size={16} />Añadir certificación
            </button>
          </div>
          <p className="field-hint">Marca «Verificada» solo si revisaste el documento. Se mostrará como «Verificada por el gimnasio».</p>
          {form.certifications.length === 0 && <p className="muted">Sin certificaciones registradas.</p>}
          <ul className="slot-list">
            {form.certifications.map((c, i) => (
              <li key={c.key || c.id} className={`cert-row ${errors.certifications?.[i] ? 'field--error' : ''}`}>
                <label className="field"><span>Certificación</span>
                  <input type="text" value={c.name} onChange={(e) => updateList('certifications', i, { name: e.target.value })} maxLength={120} />
                </label>
                <label className="field"><span>Emitida por</span>
                  <input type="text" value={c.issuer} onChange={(e) => updateList('certifications', i, { issuer: e.target.value })} maxLength={120} />
                </label>
                <label className="field"><span>Año</span>
                  <input type="number" min="1950" max="2100" value={c.year} onChange={(e) => updateList('certifications', i, { year: e.target.value })} />
                </label>
                <label className="check-row check-row--inline">
                  <input type="checkbox" checked={c.verified} onChange={(e) => updateList('certifications', i, { verified: e.target.checked })} />
                  <span>Verificada</span>
                </label>
                <button type="button" className="icon-btn" aria-label="Quitar certificación" onClick={() => removeFromList('certifications', i)}><Icon name="trash" size={18} /></button>
                {errors.certifications?.[i] && <span className="field-error slot-error">{errors.certifications[i]}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="form-card" aria-labelledby="s-clases">
          <h2 id="s-clases">Clases asignadas</h2>
          <p className="muted">La asignación a clases estará disponible cuando se active el módulo «Clases y reservas».</p>
        </section>

        <section className="form-card" aria-labelledby="s-vis">
          <h2 id="s-vis">Estado y visibilidad</h2>
          <div className="check-list">
            <label className="check-row">
              <input type="checkbox" checked={form.status === 'active'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'active' : 'inactive', is_public: e.target.checked ? f.is_public : false }))} />
              <span><strong>Activo</strong><small>Un entrenador inactivo se conserva en tu registro pero no se muestra en ningún sitio.</small></span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.is_public} disabled={form.status !== 'active'} onChange={(e) => set('is_public', e.target.checked)} />
              <span><strong>Mostrar en el perfil público del gimnasio</strong><small>Aparecerá en «Nuestros entrenadores» con su foto, especialidades y horarios.</small></span>
            </label>
            {errors.is_public && <span className="field-error">{errors.is_public}</span>}
          </div>
          <p className="field-hint">Los entrenadores no tienen acceso a finanzas ni a datos privados del gimnasio. Sus permisos dependen de lo que autorice el propietario.</p>
        </section>
      </fieldset>

      {editable && (
        <div className="form-footer">
          <Link to={listHref} className="btn btn--ghost">Cancelar</Link>
          <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'saving'}>{status === 'saving' ? 'Guardando…' : 'Guardar entrenador'}</button>
        </div>
      )}
    </form>
  );
}
