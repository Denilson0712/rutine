import { useRef, useState } from 'react';
import SectionHeader from '../ui/SectionHeader.jsx';
import { STEPS } from '../../data/landing.js';

const TABS = [
  { id: 'gimnasios', label: 'Para gimnasios' },
  { id: 'atletas', label: 'Para atletas' },
];

export default function HowItWorks() {
  const [tab, setTab] = useState('gimnasios');
  const refs = useRef({});

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = tab === 'gimnasios' ? 'atletas' : 'gimnasios';
    const target = event.key === 'Home' ? 'gimnasios' : event.key === 'End' ? 'atletas' : next;
    setTab(target);
    refs.current[target]?.focus();
  };

  return (
    <section id="como-funciona" className="section how" aria-labelledby="como-funciona-title">
      <div className="container">
        <div className="how-head">
          <SectionHeader id="como-funciona-title" title="Cómo funciona" lead="Cuatro pasos, según de qué lado del entrenamiento estés." />
          <div className="segmented" role="tablist" aria-label="Elige tu perfil" onKeyDown={onKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => { refs.current[t.id] = el; }}
                type="button"
                role="tab"
                id={`how-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="how-panel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${tab}`}>
          <ol className="steps" key={tab}>
            {STEPS[tab].map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-num" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
