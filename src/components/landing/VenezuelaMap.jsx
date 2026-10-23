import { MAP_CITIES, MAP_LINKS } from '../../data/venezuela.js';

// Proyección simple (equirectangular) del recuadro que ocupan las ciudades.
const BOUNDS = { minLon: -73, maxLon: -62, minLat: 7.3, maxLat: 11.8 };
const W = 560;
const H = 280;
const PAD = 28;

function project({ lat, lon }) {
  const x = PAD + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * (W - PAD * 2);
  const y = PAD + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - PAD * 2);
  return { x, y };
}

const POINTS = Object.fromEntries(MAP_CITIES.map((c) => [c.city, project(c)]));

// Etiquetas que se colocan a la izquierda o debajo para evitar choques.
const LABEL_LEFT = new Set(['Maracaibo', 'San Cristóbal', 'Mérida', 'Coro']);
const LABEL_BELOW = new Set(['Barcelona', 'Ciudad Guayana', 'Barquisimeto']);
const LABEL_ABOVE = new Set(['Valencia']);

export default function VenezuelaMap({ selected, onSelect }) {
  return (
    <figure className="vmap">
      <svg viewBox={`0 0 ${W} ${H}`} className="vmap-svg" role="group" aria-label="Ciudades de referencia de Venezuela">
        <g className="vmap-links" aria-hidden="true">
          {MAP_LINKS.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={POINTS[a].x} y1={POINTS[a].y} x2={POINTS[b].x} y2={POINTS[b].y} />
          ))}
        </g>
        {MAP_CITIES.map(({ city }) => {
          const p = POINTS[city];
          const active = selected === city;
          const left = LABEL_LEFT.has(city);
          const below = LABEL_BELOW.has(city);
          const above = LABEL_ABOVE.has(city);
          return (
            <g
              key={city}
              className={`vmap-city ${active ? 'is-active' : ''}`}
              transform={`translate(${p.x} ${p.y})`}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`Elegir ${city}`}
              onClick={() => onSelect(city)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(city);
                }
              }}
            >
              <circle r="14" className="vmap-hit" />
              <circle r={active ? 6 : 4} className="vmap-dot" />
              <text
                x={below || above ? 0 : left ? -10 : 10}
                y={below ? 20 : above ? -10 : 4}
                textAnchor={below || above ? 'middle' : left ? 'end' : 'start'}
              >
                {city}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>Ciudades de referencia. La red crece con cada gimnasio que se afilia.</figcaption>
    </figure>
  );
}
