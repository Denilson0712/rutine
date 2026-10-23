import Logo from '../ui/Logo.jsx';
import { Link, SectionLink, ROUTES } from '../../lib/router.jsx';
import { business } from '../../config/business.js';

export default function Footer() {
  const hasContact = business.contactEmail || business.contactWhatsapp;
  const hasLegal = business.termsUrl || business.privacyUrl;
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>La plataforma que conecta gimnasios, entrenadores y atletas en Venezuela.</p>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="footer-title">Plataforma</h2>
          <ul>
            <li><Link to={ROUTES.home}>Inicio</Link></li>
            <li><Link to={ROUTES.explore}>Explorar gimnasios</Link></li>
            <li><SectionLink section="como-funciona">Cómo funciona</SectionLink></li>
            <li><SectionLink section="faq">Preguntas frecuentes</SectionLink></li>
          </ul>
        </nav>

        <nav aria-label="Gimnasios y cuentas">
          <h2 className="footer-title">Cuentas</h2>
          <ul>
            <li><Link to={ROUTES.affiliation}>Afiliar mi gimnasio</Link></li>
            <li><SectionLink section="afiliacion">Modelo comercial</SectionLink></li>
            <li><Link to={ROUTES.access}>Iniciar sesión</Link></li>
          </ul>
        </nav>

        {hasContact || business.social.length > 0 ? (
          <div>
            <h2 className="footer-title">Contacto</h2>
            <ul>
              {business.contactEmail ? (
                <li><a href={`mailto:${business.contactEmail}`}>{business.contactEmail}</a></li>
              ) : null}
              {business.contactWhatsapp ? (
                <li>
                  <a href={`https://wa.me/${business.contactWhatsapp.replace(/\D/g, '')}`} rel="noopener noreferrer" target="_blank">
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {business.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="container">
        <div className="footer-bottom">
        <p>© {year} {business.brandName}. Hecho para el fitness venezolano.</p>
        {hasLegal ? (
          <ul className="footer-legal">
            {business.termsUrl ? <li><a href={business.termsUrl}>Términos</a></li> : null}
            {business.privacyUrl ? <li><a href={business.privacyUrl}>Privacidad</a></li> : null}
          </ul>
        ) : null}
        </div>
      </div>
    </footer>
  );
}
