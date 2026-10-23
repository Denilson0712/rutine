/**
 * Iconos de trazo propio (24×24, trazo 1.75) para no depender de una librería externa.
 * Todos son decorativos por defecto (aria-hidden); el texto que los acompaña da el significado.
 */
const PATHS = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 1 1 13 0c0 5.3-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18V6.5A1.5 1.5 0 0 1 5.5 5H16" />
      <path d="M16 13.5h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  refresh: <path d="M19.5 10.5A7.5 7.5 0 0 0 6 7M4.5 13.5A7.5 7.5 0 0 0 18 17M6 3.5V7h3.5M18 20.5V17h-3.5" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2c2.1.8 3.5 2.9 3.5 5.8" />
    </>
  ),
  trainer: (
    <>
      <circle cx="10" cy="7.5" r="3.8" />
      <path d="M3 20.5c0-3.9 3.1-7 7-7 1.4 0 2.7.4 3.8 1.1" />
      <path d="M15 18.2l2 2 4-4.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  chart: <path d="M4 4v16h16M8.5 16v-4M12.5 16V8M16.5 16v-6" />,
  store: (
    <>
      <path d="M4.5 10.5V20h15v-9.5" />
      <path d="M3 10.5L5 4h14l2 6.5H3z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  route: (
    <>
      <path d="M6 19c0-6 12-4 12-11" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="6" r="2" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = '', title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
