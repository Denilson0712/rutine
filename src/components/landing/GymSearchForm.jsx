import { useId, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { STATES, stateOfCity } from '../../data/venezuela.js';
import { navigate, ROUTES } from '../../lib/router.jsx';

/**
 * Buscador de gimnasios. Por defecto lleva a /gimnasios con los filtros en la URL,
 * de modo que la búsqueda se pueda compartir y conectar luego a la API real.
 */
export default function GymSearchForm({ initial = {}, onSearch, compact = false, value, onChange }) {
  const uid = useId();
  const [internal, setInternal] = useState({
    estado: initial.estado ?? '',
    ciudad: initial.ciudad ?? '',
    nombre: initial.nombre ?? '',
  });
  // Permite que un componente padre controle el formulario (por ejemplo, el mapa).
  const form = value ?? internal;
  const setForm = onChange ?? setInternal;

  const cities = form.estado
    ? STATES.find((s) => s.name === form.estado)?.cities ?? []
    : STATES.flatMap((s) => s.cities).sort((a, b) => a.localeCompare(b, 'es'));

  const update = (patch) => setForm({ ...form, ...patch });

  const submit = (event) => {
    event.preventDefault();
    const filters = {
      estado: form.estado || stateOfCity(form.ciudad),
      ciudad: form.ciudad,
      nombre: form.nombre.trim(),
    };
    if (onSearch) {
      onSearch(filters);
      return;
    }
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    navigate(`${ROUTES.explore}${qs ? `?${qs}` : ''}`);
  };

  return (
    <form className={`search ${compact ? 'search--compact' : ''}`} onSubmit={submit} role="search" aria-label="Buscar gimnasios">
      <div className="field">
        <label htmlFor={`${uid}-estado`}>Estado</label>
        <select
          id={`${uid}-estado`}
          value={form.estado}
          onChange={(e) => {
            const estado = e.target.value;
            const keepCity = estado && STATES.find((s) => s.name === estado)?.cities.includes(form.ciudad);
            update({ estado, ciudad: keepCity ? form.ciudad : '' });
          }}
        >
          <option value="">Todos los estados</option>
          {STATES.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${uid}-ciudad`}>Ciudad</label>
        <select
          id={`${uid}-ciudad`}
          value={form.ciudad}
          onChange={(e) => {
            const ciudad = e.target.value;
            update({ ciudad, estado: form.estado || stateOfCity(ciudad) });
          }}
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field field--grow">
        <label htmlFor={`${uid}-nombre`}>Nombre del gimnasio <span className="optional">(opcional)</span></label>
        <input
          id={`${uid}-nombre`}
          type="search"
          value={form.nombre}
          onChange={(e) => update({ nombre: e.target.value })}
          placeholder="Ej.: nombre del gimnasio"
          autoComplete="off"
          maxLength={80}
        />
      </div>

      <button type="submit" className="btn btn--primary search-submit">
        <Icon name="search" size={18} />
        Buscar
      </button>
    </form>
  );
}
