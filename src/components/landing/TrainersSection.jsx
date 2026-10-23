import { useState } from 'react';
import DemoBadge from '../ui/DemoBadge.jsx';
import Icon from '../ui/Icon.jsx';
import { DEMO_AGENDA, DEMO_TRAINERS } from '../../data/demo.js';

export default function TrainersSection() {
  const [sessions, setSessions] = useState(DEMO_AGENDA.sessions);
  const [selectedId, setSelectedId] = useState(DEMO_AGENDA.sessions[0].id);
  const selected = sessions.find((s) => s.id === selectedId);
  const trainer = DEMO_TRAINERS.find((t) => t.initials === selected.trainer);

  const change = (delta) =>
    setSessions((list) =>
      list.map((s) =>
        s.id === selectedId ? { ...s, booked: Math.min(s.capacity, Math.max(0, s.booked + delta)) } : s,
      ),
    );

  const free = selected.capacity - selected.booked;

  return (
    <section id="entrenadores" className="section trainers" aria-labelledby="entrenadores-title">
      <div className="container trainers-grid">
        <div className="trainers-copy">
          <h2 id="entrenadores-title">Cada entrenador, cada horario y cada cupo en orden</h2>
          <p className="lead">
            El gimnasio registra a sus entrenadores con su especialidad, experiencia y horarios. Cada sesión tiene una capacidad máxima.
          </p>
          <p>
            Los cupos se descuentan con cada reserva confirmada y se liberan con cada cancelación válida. La disponibilidad
            depende de cómo configure sus horarios cada gimnasio y cada entrenador.
          </p>

          <ul className="trainer-cards" aria-label="Perfiles de ejemplo">
            {DEMO_TRAINERS.map((t) => (
              <li key={t.initials} className="trainer-card">
                <span className="avatar" aria-hidden="true">{t.initials}</span>
                <div>
                  <strong>{t.role}</strong>
                  <span>{t.specialty} · {t.years} años</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="fine-print">Perfiles de ejemplo, no corresponden a personas reales.</p>
        </div>

        <div className="agenda" aria-label="Agenda semanal de ejemplo">
          <div className="agenda-head">
            <h3>Agenda de la semana</h3>
            <DemoBadge>Demostración interactiva</DemoBadge>
          </div>

          <div className="agenda-scroll">
          <div className="agenda-grid" style={{ '--days': DEMO_AGENDA.days.length }}>
            <span className="agenda-corner" aria-hidden="true" />
            {DEMO_AGENDA.days.map((d) => (
              <span key={d} className="agenda-day">{d}</span>
            ))}
            {DEMO_AGENDA.slots.map((slot) => (
              <div key={slot} className="agenda-row" role="presentation">
                <span className="agenda-time">{slot}</span>
                {DEMO_AGENDA.days.map((_, dayIdx) => {
                  const s = sessions.find((x) => x.day === dayIdx && x.slot === slot);
                  if (!s) return <span key={dayIdx} className="agenda-cell" />;
                  const isFull = s.booked >= s.capacity;
                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      className={`agenda-cell agenda-session ${s.id === selectedId ? 'is-selected' : ''} ${isFull ? 'is-full' : ''}`}
                      aria-pressed={s.id === selectedId}
                      aria-label={`${s.name}, ${DEMO_AGENDA.days[dayIdx]} ${slot}, ${s.booked} de ${s.capacity} cupos`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <span className="agenda-session-name">{s.name}</span>
                      <span className="agenda-session-count">{s.booked}/{s.capacity}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          </div>

          <div className="agenda-detail" aria-live="polite">
            <div className="agenda-detail-info">
              <span className="avatar avatar--sm" aria-hidden="true">{trainer.initials}</span>
              <div>
                <strong>{selected.name} · {DEMO_AGENDA.days[selected.day]} {selected.slot}</strong>
                <span>{trainer.role}</span>
              </div>
            </div>
            <div className="meter" style={{ '--fill': `${(selected.booked / selected.capacity) * 100}%` }}><span /></div>
            <p className="agenda-free">
              {free === 0 ? 'Sesión completa: no quedan cupos.' : `Quedan ${free} de ${selected.capacity} cupos.`}
            </p>
            <div className="agenda-actions">
              <button type="button" className="btn btn--small btn--primary" onClick={() => change(1)} disabled={free === 0}>
                <Icon name="check" size={16} /> Simular reserva
              </button>
              <button type="button" className="btn btn--small btn--ghost" onClick={() => change(-1)} disabled={selected.booked === 0}>
                Simular cancelación
              </button>
            </div>
            <p className="fine-print">Esta demostración no crea reservas reales.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
