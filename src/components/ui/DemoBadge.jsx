import Icon from './Icon.jsx';

/** Marca visible para todo contenido ilustrativo que no son datos reales. */
export default function DemoBadge({ children = 'Datos de demostración' }) {
  return (
    <span className="demo-badge">
      <Icon name="info" size={14} />
      {children}
    </span>
  );
}
