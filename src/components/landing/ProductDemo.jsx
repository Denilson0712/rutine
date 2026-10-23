import { useRef, useState } from 'react';
import DemoBadge from '../ui/DemoBadge.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import { DEMO_SUMMARY, DEMO_MEMBERS, DEMO_SESSIONS } from '../../data/demo.js';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'membresias', label: 'Membresías' },
  { id: 'sesiones', label: 'Sesiones' },
];

function Summary() {
  const max = Math.max(...DEMO_SUMMARY.weeklyIncome.map((d) => d.value));
  return (
    <div className="demo-summary">
      <dl className="kpis">
        <div><dt>Ingresos del mes</dt><dd>{DEMO_SUMMARY.income}</dd></div>
        <div><dt>Gastos del mes</dt><dd>{DEMO_SUMMARY.expenses}</dd></div>
        <div><dt>Membresías activas</dt><dd>{DEMO_SUMMARY.activeMemberships}</dd></div>
        <div className="kpi--warn"><dt>Pagos pendientes</dt><dd>{DEMO_SUMMARY.pendingPayments}</dd></div>
        <div><dt>Renovaciones esta semana</dt><dd>{DEMO_SUMMARY.renewalsThisWeek}</dd></div>
        <div><dt>Entrenadores registrados</dt><dd>{DEMO_SUMMARY.trainers}</dd></div>
      </dl>
      <figure className="bars">
        <figcaption>Ingresos por día, en US$</figcaption>
        <ul>
          {DEMO_SUMMARY.weeklyIncome.map((d) => (
            <li key={d.label}>
              <span className="bar-value">{d.value}</span>
              <span className="bar" style={{ '--h': `${(d.value / max) * 100}%` }} />
              <span className="bar-label">{d.label}</span>
            </li>
          ))}
        </ul>
      </figure>
    </div>
  );
}

function Memberships() {
  return (
    <table className="demo-table">
      <caption className="visually-hidden">Próximas renovaciones (demostración)</caption>
      <thead>
        <tr><th scope="col">Miembro</th><th scope="col">Plan</th><th scope="col">Estado</th></tr>
      </thead>
      <tbody>
        {DEMO_MEMBERS.map((m) => (
          <tr key={m.id}>
            <th scope="row">{m.id}</th>
            <td>{m.plan}</td>
            <td><span className={`status status--${m.status}`}>{m.detail}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Sessions() {
  return (
    <ul className="occupancy">
      {DEMO_SESSIONS.map((s) => {
        const pct = Math.round((s.booked / s.capacity) * 100);
        const full = s.booked >= s.capacity;
        return (
          <li key={s.name + s.time}>
            <div className="occupancy-head">
              <strong>{s.name}</strong>
              <span>{s.time}</span>
              <span className={full ? 'status status--late' : 'occupancy-count'}>
                {full ? 'Completa' : `${s.booked} de ${s.capacity}`}
              </span>
            </div>
            <div className="meter" style={{ '--fill': `${pct}%` }}><span /></div>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProductDemo() {
  const [tab, setTab] = useState('resumen');
  const tabRefs = useRef({});

  const onKeyDown = (event) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = null;
    if (event.key === 'ArrowRight') next = TABS[(idx + 1) % TABS.length];
    if (event.key === 'ArrowLeft') next = TABS[(idx - 1 + TABS.length) % TABS.length];
    if (event.key === 'Home') next = TABS[0];
    if (event.key === 'End') next = TABS[TABS.length - 1];
    if (next) {
      event.preventDefault();
      setTab(next.id);
      tabRefs.current[next.id]?.focus();
    }
  };

  return (
    <section id="panel" className="section demo" aria-labelledby="panel-title">
      <div className="container">
        <SectionHeader
          id="panel-title"
          title="Así se ve tu gimnasio desde el panel"
          lead="Una vista previa de lo que verás cada día: dinero, membresías y ocupación de tus clases."
        />

        <div className="app-frame">
          <div className="app-frame-bar">
            <div className="app-frame-dots" aria-hidden="true"><span /><span /><span /></div>
            <div className="tabs" role="tablist" aria-label="Vistas del panel" onKeyDown={onKeyDown}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[t.id] = el; }}
                  role="tab"
                  type="button"
                  id={`demo-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`demo-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DemoBadge />
          </div>
          <div
            className="app-frame-body"
            role="tabpanel"
            id={`demo-panel-${tab}`}
            aria-labelledby={`demo-tab-${tab}`}
          >
            {tab === 'resumen' && <Summary />}
            {tab === 'membresias' && <Memberships />}
            {tab === 'sesiones' && <Sessions />}
          </div>
        </div>
        <p className="fine-print">Las cifras son ilustrativas y no corresponden a ningún gimnasio real.</p>
      </div>
    </section>
  );
}
