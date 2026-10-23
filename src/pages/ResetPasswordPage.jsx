import { useRef, useState } from 'react';
import Field from '../components/ui/Field.jsx';
import FormNotice from '../components/ui/FormNotice.jsx';
import { Link, ROUTES } from '../lib/router.jsx';
import { updatePassword } from '../services/auth.js';

/** Destino del enlace de recuperación que envía Supabase por correo. */
export default function ResetPasswordPage() {
  const [values, setValues] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const noticeRef = useRef(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    const e = {};
    if (values.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (values.confirm !== values.password) e.confirm = 'Las contraseñas no coinciden.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus('sending');
    const res = await updatePassword(values.password);
    setMessage(res.message || '');
    setStatus(res.ok ? 'ok' : res.reason === 'not_connected' ? 'not_connected' : 'error');
    requestAnimationFrame(() => noticeRef.current?.focus());
  };

  return (
    <div className="page">
      <div className="container access-page">
        <div className="form-card form-card--narrow">
          <h1>Crea una contraseña nueva</h1>
          {status === 'ok' && (
            <FormNotice innerRef={noticeRef} tone="ok" title="Contraseña actualizada">
              Ya puedes usar tu nueva contraseña. <Link to={ROUTES.access}>Iniciar sesión</Link>
            </FormNotice>
          )}
          {status === 'not_connected' && (
            <FormNotice innerRef={noticeRef} tone="warn" title="Las cuentas todavía no están disponibles">
              El servidor de cuentas aún no está conectado, así que no se ha cambiado ninguna contraseña.
            </FormNotice>
          )}
          {status === 'error' && (
            <FormNotice innerRef={noticeRef} tone="error" title="No se pudo cambiar la contraseña">
              {message || 'El enlace puede haber caducado. Solicita uno nuevo desde «¿Olvidaste tu contraseña?».'}
            </FormNotice>
          )}
          <form onSubmit={onSubmit} noValidate className="stack">
            <Field label="Contraseña nueva" error={errors.password} hint="Mínimo 8 caracteres.">
              <input type="password" autoComplete="new-password" value={values.password}
                onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))} />
            </Field>
            <Field label="Repite la contraseña" error={errors.confirm}>
              <input type="password" autoComplete="new-password" value={values.confirm}
                onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))} />
            </Field>
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={status === 'sending'}>
              Guardar contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
