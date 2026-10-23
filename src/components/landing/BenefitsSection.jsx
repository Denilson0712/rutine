import Icon from '../ui/Icon.jsx';
import DemoBadge from '../ui/DemoBadge.jsx';
import { BENEFIT_GROUPS } from '../../data/landing.js';
import { DEMO_MEMBERS } from '../../data/demo.js';

export default function BenefitsSection() {
  return (
    <section id="gimnasios" className="section benefits" aria-labelledby="gimnasios-title">
      <div className="container">
        <div className="benefits-intro">
          <h2 id="gimnasios-title">Menos desorden. Más control. Más oportunidades para crecer.</h2>
          <div className="benefits-problem">
            <p className="lead">
              Cuadernos, hojas de cálculo y mensajes sueltos para saber quién pagó y quién no.
            </p>
            <p>
              Rutine reúne pagos, membresías, entrenadores y horarios en un panel, para que dediques tu tiempo al gimnasio y no al papeleo.
            </p>
          </div>
        </div>

        <div className="benefits-layout">
          <div className="benefit-groups">
            {BENEFIT_GROUPS.map((group) => (
              <article key={group.id} className="benefit-group">
                <header>
                  <h3>{group.title}</h3>
                  <p>{group.text}</p>
                </header>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.title}>
                      <span className="benefit-icon"><Icon name={item.icon} size={20} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <aside className="members-mock" aria-label="Ejemplo de seguimiento de membresías">
            <div className="members-mock-head">
              <h3>Estado de membresías</h3>
              <DemoBadge />
            </div>
            <ul className="members-list">
              {DEMO_MEMBERS.map((m) => (
                <li key={m.id}>
                  <span className="members-id">{m.id}</span>
                  <span className="members-plan">{m.plan}</span>
                  <span className={`status status--${m.status}`}>{m.detail}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="marketplace-band">
          <span className="marketplace-icon"><Icon name="store" size={26} /></span>
          <div>
            <h3>Presencia dentro del marketplace</h3>
            <p>Tu gimnasio aparece con su perfil, servicios y horarios cuando un atleta busca dónde entrenar en tu ciudad.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
