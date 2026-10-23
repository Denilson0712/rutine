import { useRef, useState } from 'react';
import Field from '../components/ui/Field.jsx';
import FormNotice from '../components/ui/FormNotice.jsx';
import Icon from '../components/ui/Icon.jsx';
import { STATES } from '../data/venezuela.js';
import { AFFILIATION_VALUE } from '../data/landing.js';
import { EMAIL_RE, VE_PHONE_RE, normalizePhone } from '../lib/validation.js';
import { submitAffiliation } from '../services/affiliation.js';

const EMPTY = {
  gymName: '',
  ownerName: '',
  estado: '',
  ciudad: '',
  phone: '',
  email: '',
  size: '',
  message: '',
  consent: false,
};

function validate(v) {
  const e = {};
  if (v.gymName.trim().length < 2) e.gymName = 'Escribe el nombre del gimnasio.';
  if (v.ownerName.trim().length < 3) e.ownerName = 'Escribe tu nombre y apellido.';
  if (!v.estado) e.estado = 'Elige el estado.';
  if (!v.ciudad) e.ciudad = 'Elige la ciudad.';
  if (!VE_PHONE_RE.test(normalizePhone(v.phone))) e.phone = 'Usa un teléfono venezolano válido, por ejemplo 0414-1234567.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (!v.consent) e.consent = 'Necesitamos tu permiso para contactarte sobre la afiliación.';
  return e;
}

export default function AffiliationPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | not_connected | error
  const noticeRef = useRef(null);
  const formRef = useRef(null);

  const set = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((v) => ({ ...v, [name]: value, ...(name === 'estado' ? { ciudad: '' } : {}) }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const cities = STATES.find((s) => s.name === values.estado)?.cities ?? [];

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus('idle');
      // Esperar a que React pinte los errores antes de mover el foco.
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setStatus('sending');
    try {
      const res = await submitAffiliation({ ...values, phone: normalizePhone(values.phone) });
      setStatus(res.ok ? 'sent' : res.reason === 'not_connected' ? 'not_connected' : 'error');
    } catch {
      setStatus('error');
    }
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  return (
    <div className="page">
      <div className="container affiliation-page">
        <aside className="affiliation-page-side">
          <h1>Solicitar afiliación</h1>
          <p className="lead">Cuéntanos sobre tu gimnasio. Revisaremos tu solicitud y te contactaremos para explicarte los siguientes pasos y las condiciones comerciales.</p>
          <ul className="checklist">
            {AFFILIATION_VALUE.map((item) => (
              <li key={item}><Icon name="check" size={18} />{item}</li>
            ))}
          </ul>
        </aside>

        <form ref={formRef} className="form-card" onSubmit={onSubmit} noValidate aria-describedby="af-required">
          <p id="af-required" className="fine-print">Todos los campos son obligatorios salvo los marcados como opcionales.</p>

          {status === 'not_connected' && (
            <FormNotice innerRef={noticeRef} tone="warn" title="Tu solicitud no se ha enviado todavía">
              El envío de solicitudes aún no está conectado a un servidor. Tus datos siguen en el formulario y no se han compartido con nadie.
            </FormNotice>
          )}
          {status === 'error' && (
            <FormNotice innerRef={noticeRef} tone="error" title="No se pudo enviar la solicitud">
              Revisa tu conexión e inténtalo de nuevo.
            </FormNotice>
          )}
          {status === 'sent' && (
            <FormNotice innerRef={noticeRef} tone="ok" title="Solicitud enviada">
              Te contactaremos por correo o teléfono para continuar.
            </FormNotice>
          )}

          <div className="form-grid">
            <Field label="Nombre del gimnasio" error={errors.gymName}>
              <input type="text" value={values.gymName} onChange={set('gymName')} autoComplete="organization" maxLength={80} />
            </Field>
            <Field label="Tu nombre y apellido" error={errors.ownerName}>
              <input type="text" value={values.ownerName} onChange={set('ownerName')} autoComplete="name" maxLength={80} />
            </Field>
            <Field label="Estado" error={errors.estado}>
              <select value={values.estado} onChange={set('estado')}>
                <option value="">Elige un estado</option>
                {STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Ciudad" error={errors.ciudad} hint={values.estado ? undefined : 'Primero elige el estado.'}>
              <select value={values.ciudad} onChange={set('ciudad')} disabled={!values.estado}>
                <option value="">Elige una ciudad</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Teléfono" error={errors.phone}>
              <input type="tel" value={values.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="0414-1234567" />
            </Field>
            <Field label="Correo electrónico" error={errors.email}>
              <input type="email" value={values.email} onChange={set('email')} autoComplete="email" placeholder="nombre@correo.com" />
            </Field>
            <Field label="Miembros activos aproximados" optional className="field--full">
              <select value={values.size} onChange={set('size')}>
                <option value="">Prefiero no decirlo</option>
                <option value="0-50">Hasta 50</option>
                <option value="51-150">De 51 a 150</option>
                <option value="151-400">De 151 a 400</option>
                <option value="400+">Más de 400</option>
              </select>
            </Field>
            <Field label="¿Algo más que debamos saber?" optional className="field--full">
              <textarea rows={4} value={values.message} onChange={set('message')} maxLength={600} placeholder="Servicios, número de sedes, horarios…" />
            </Field>
          </div>

          <div className={`check ${errors.consent ? 'field--error' : ''}`}>
            <input id="af-consent" type="checkbox" checked={values.consent} onChange={set('consent')} aria-invalid={Boolean(errors.consent) || undefined} aria-describedby={errors.consent ? 'af-consent-error' : undefined} />
            <label htmlFor="af-consent">Acepto que Rutine me contacte para hablar de la afiliación de mi gimnasio.</label>
            {errors.consent ? <span id="af-consent-error" className="field-error">{errors.consent}</span> : null}
          </div>

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Enviando solicitud…' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
