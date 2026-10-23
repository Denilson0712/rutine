import Icon from '../ui/Icon.jsx';
import { FAQ } from '../../data/landing.js';

export default function FaqSection() {
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="container faq-grid">
        <div>
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <p className="lead">Lo que suelen preguntar dueños de gimnasios y atletas antes de empezar.</p>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                <span>{item.q}</span>
                <Icon name="chevron" size={20} className="faq-chevron" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
