import { useRef, useState } from 'react';
import Field from '../components/ui/Field.jsx';
import Icon from '../components/ui/Icon.jsx';
import FormNotice from '../components/ui/FormNotice.jsx';
import { Link, ROUTES, navigate, useLocation } from '../lib/router.jsx';
import { EMAIL_RE } from '../lib/validation.js';
import { signIn, signUp, requestPasswordReset, loadSession } from '../services/auth.js';
import { defaultDestination, safeReturnPath } from '../lib/workspaces.js';
import { useAuth } from '../auth/AuthProvider.jsx';

const MODES = [
  { id: 'login', label: 'Iniciar sesión' },
  { id: 'signup', label: 'Crear cuenta' },
];

export default function AccessPage() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [message, setMessage] = useState('');
  const { refresh, backendConfigured, enterDemo } = useAuth();
  const enterAs = (role) => {
    const sess = enterDemo(role);
    navigate(safeReturnPath(searchParams.get('volver')) || (role === 'owner' ? defaultDestination(sess.workspaces) : '/cuenta'));
  };
  const { searchParams } = useLocation();
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
    if (mode !== 'reset' && (mode === 'signup' ? values.password.length < 8 : values.password.length === 0)) {
      e.password = mode === 'signup' ? 'La contraseña debe tener al menos 8 caracteres.' : 'Escribe tu contraseña.';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setStatus('sending');
    const res = mode === 'login' ? await signIn(values) : mode === 'signup' ? await signUp(values) : await requestPasswordReset(values.email);
    setMessage(res.message || '');
    if (res.ok && mode === 'login') {
      // El destino se decide con los espacios que confirma el servidor.
      const { workspaces } = await loadSession();
      await refresh();
      navigate(safeReturnPath(searchParams.get('volver')) || defaultDestination(workspaces));
      return;
    }
    if (res.ok && mode === 'signup' && !res.needsConfirmation) {
      await refresh();
      navigate(safeReturnPath(searchParams.get('volver')) || ROUTES.explore);
      return;
    }
    setStatus(res.ok ? (mode === 'signup' ? 'confirm' : 'reset_sent') : res.reason === 'not_connected' ? 'not_connected' : 'error');
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  return (
    <div className="page">
      <div className="container access-page">
        <div className="form-card form-card--narrow">
          <h1>{mode === 'login' ? 'Accede a tu cuenta' : mode === 'signup' ? 'Crea tu cuenta' : 'Recupera tu contraseña'}</h1>

          {!backendConfigured && (
            <section className="demo-access" aria-labelledby="demo-access-t">
              <h2 id="demo-access-t">Probar en modo demostración</h2>
              <p>Todavía no hay servidor de cuentas. Entra con un perfil de prueba para ver cómo funciona por dentro. No se guarda nada real.</p>
              <div className="demo-access-buttons">
                <button type="button" className="btn btn--primary btn--lg" onClick={() => enterAs('owner')}>
                  <Icon name="store" size={20} />Entrar como dueño de gimnasio
                </button>
                <button type="button" className="btn btn--ghost btn--lg" onClick={() => enterAs('athlete')}>
                  <Icon name="dumbbell" size={20} />Entrar como atleta
                </button>
              </div>
            </section>
          )}

          {mode !== 'reset' && (
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
          )}

          {status === 'not_connected' && (
            <FormNotice innerRef={noticeRef} tone="warn" title="Las cuentas todavía no están disponibles">
              {mode === 'login'
                ? 'El inicio de sesión aún no está conectado a un servidor, así que no se ha iniciado ninguna sesión.'
                : mode === 'signup'
                  ? 'El registro aún no está conectado a un servidor, así que no se ha creado ninguna cuenta.'
                  : 'La recuperación de contraseña aún no está conectada a un servidor, así que no se ha enviado ningún correo.'}
            </FormNotice>
          )}
          {status === 'error' && (
            <FormNotice innerRef={noticeRef} tone="error" title="No se pudo completar la operación">
              {message || 'Revisa tus datos e inténtalo de nuevo.'}
            </FormNotice>
          )}
          {status === 'confirm' && (
            <FormNotice innerRef={noticeRef} tone="ok" title="Revisa tu correo">
              Te enviamos un enlace para confirmar tu cuenta. Después podrás iniciar sesión.
            </FormNotice>
          )}
          {status === 'reset_sent' && (
            <FormNotice innerRef={noticeRef} tone="ok" title="Revisa tu correo">
              Si existe una cuenta con ese correo, recibirás un enlace para crear una contraseña nueva.
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
            {mode !== 'reset' && (
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
            )}
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={status === 'sending'}>
              {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
            </button>
          </form>

          <p className="access-foot">
            {mode === 'reset' ? (
              <button type="button" className="link-button" onClick={() => switchMode('login')}>Volver a iniciar sesión</button>
            ) : mode === 'login' ? (
              <button type="button" className="link-button" onClick={() => switchMode('reset')}>¿Olvidaste tu contraseña?</button>
            ) : null}
          </p>

          <p className="access-foot">
            ¿Administras un gimnasio? <Link to={ROUTES.affiliation}>Solicita la afiliación</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
