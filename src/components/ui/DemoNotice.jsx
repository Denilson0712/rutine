import Icon from './Icon.jsx';

/** Aviso visible en toda pantalla que muestra datos de demostración. */
export default function DemoNotice({ children }) {
  return (
    <div className="demo-notice" role="note">
      <Icon name="info" size={18} />
      <p>{children}</p>
    </div>
  );
}
