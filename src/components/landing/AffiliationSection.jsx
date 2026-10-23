import Icon from '../ui/Icon.jsx';
import { Link, ROUTES } from '../../lib/router.jsx';
import { AFFILIATION_VALUE } from '../../data/landing.js';
import { business } from '../../config/business.js';

export default function AffiliationSection() {
  const hasRate = business.commissionRate != null;

  return (
    <section id="afiliacion" className="section affiliation" aria-labelledby="afiliacion-title">
      <div className="container affiliation-grid">
        <div className="affiliation-copy">
          <h2 id="afiliacion-title">Haz que tu gimnasio forme parte de una red que conecta atletas y negocios</h2>
          <p className="lead">
            Te afilias, configuras tu gimnasio y empiezas a gestionarlo desde Rutine mientras ganas visibilidad frente a atletas de tu ciudad.
          </p>
          <Link to={ROUTES.affiliation} className="btn btn--primary btn--lg">Solicitar afiliación</Link>
        </div>

        <div className="affiliation-panel">
          <div className="affiliation-block">
            <h3>Lo que recibe tu gimnasio</h3>
            <ul className="checklist">
              {AFFILIATION_VALUE.map((item) => (
                <li key={item}><Icon name="check" size={18} />{item}</li>
              ))}
            </ul>
          </div>

          <div className="affiliation-block affiliation-block--model">
            <h3>Un modelo comercial transparente</h3>
            {hasRate ? (
              <p>
                Rutine cobra una comisión del <strong>{business.commissionRate} %</strong>
                {business.commissionScope ? ` ${business.commissionScope}` : ''}. Revisamos contigo todas las condiciones durante la afiliación.
              </p>
            ) : (
              <p>
                Rutine funciona con una comisión porcentual sobre las operaciones acordadas con cada gimnasio. El porcentaje y sus
                condiciones se te explican con claridad durante la afiliación, antes de que confirmes.
              </p>
            )}
            <p className="affiliation-note">
              <Icon name="lock" size={16} />
              Antes de afiliarte sabrás qué pagas y qué recibes a cambio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
