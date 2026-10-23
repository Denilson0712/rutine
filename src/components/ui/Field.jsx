import { cloneElement, useId } from 'react';

/** Envuelve un control de formulario con etiqueta, ayuda y error accesibles. */
export default function Field({ label, hint, error, optional, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label} {optional ? <span className="optional">(opcional)</span> : null}
      </label>
      {cloneElement(children, { id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy })}
      {hint ? <span id={hintId} className="field-hint">{hint}</span> : null}
      {error ? <span id={errorId} className="field-error">{error}</span> : null}
    </div>
  );
}
