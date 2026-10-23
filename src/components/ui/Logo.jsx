import { Link } from '../../lib/router.jsx';

/**
 * Marca provisional de Rutine: una ruta que conecta dos puntos.
 * Es un punto de partida, no un logotipo definitivo.
 */
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <path d="M8 24c0-7 8-5 8-11s5-6 8-6" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8" cy="24" r="2.6" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2.2" />
      <circle cx="24" cy="7" r="3" fill="var(--accent)" />
    </svg>
  );
}

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="logo" aria-label="Rutine, ir al inicio" onClick={onClick}>
      <LogoMark />
      <span className="logo-word">Rutine</span>
    </Link>
  );
}
