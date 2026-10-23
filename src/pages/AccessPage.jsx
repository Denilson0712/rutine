import { useRef, useState } from 'react';
import Field from '../components/ui/Field.jsx';
import FormNotice from '../components/ui/FormNotice.jsx';
import { Link, ROUTES } from '../lib/router.jsx';
import { EMAIL_RE } from '../lib/validation.js';
import { signIn, signUp } from '../services/auth.js';

const MODES = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'signup', label: 'Crear cuenta' },
];

export default function AccessPage() {
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const noticeRef = useRef(null);
  const formRef = useRef(null);
  const tabRefs = useRef({});

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const switchMode = (id) => {
    setMode(id);
    setErrors({});
    setStatus('idle');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const e = {};
    if (mode === 'signup' && values.name.trim().length < 3) e.name = 'Escribe tu nombre.';
    if (!EMAIL_RE.test(values.email.trim())) e.email = 'Escribe un correo válido.';
    if (mode === 'signup' ? values.password.length < 8 : values.password.length === 0) {
      e.password = mode === 'signup' ? 'La contraseña debe tener al menos 8 caracteres.' : 'Escribe tu contraseña.';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setStatus('sending');
    const res = mode === 'login' ? await signIn(values) : await signUp(values);
    setStatus(res.ok ? 'ok' : res.reason === 'not_connected' ? 'not_connected' : 'error');
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  return (
    <div className="page">
      <div className="container access-page">
        <div className="form-card form-card--narrow">
          <h1>{mode === 'login' ? 'Accede a tu cuenta' : 'Crea tu cuenta de atleta'}</h1>

          <div
            className="segmented segmented--full"
            role="tablist"
            aria-label="Tipo de acceso"
            onKeyDown={(e) => {
              if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
              e.preventDefault();
              const next = mode === 'login' ? 'signup' : 'login';
              switchMode(next);
              tabRefs.current[next]?.focus();
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                ref={(el) => { tabRefs.current[m.id] = el; }}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                tabIndex={mode === m.id ? 0 : -1}
                onClick={() => switchMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {status === 'not_connected' && (
            <FormNotice innerRef={noticeRef} tone="warn" title="Las cuentas todavía no están disponibles">
              {mode === 'login'
                ? 'El inicio de sesión aún no está conectado a un servidor, así que no se ha iniciado ninguna sesión.'
                : 'El registro aún no está conectado a un servidor, así que no se ha creado ninguna cuenta.'}
            </FormNotice>
          )}
          {status === 'error' && (
            <FormNotice innerRef={noticeRef} tone="error" title="No se pudo completar la operación">
              Revisa tus datos e inténtalo de nuevo.
            </FormNotice>
          )}

          <form ref={formRef} onSubmit={onSubmit} noValidate className="stack">
            {mode === 'signup' && (
              <Field label="Nombre" error={errors.name}>
                <input type="text" value={values.name} onChange={set('name')} autoComplete="name" />
              </Field>
            )}
            <Field label="Correo electrónico" error={errors.email}>
              <input type="email" value={values.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field
              label="Contraseña"
              error={errors.password}
              hint={mode === 'signup' ? 'Mínimo 8 caracteres.' : undefined}
            >
              <input
                type="password"
                value={values.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={status === 'sending'}>
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="access-foot">
            ¿Administras un gimnasio? <Link to={ROUTES.affiliation}>Solicita la afiliación</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
