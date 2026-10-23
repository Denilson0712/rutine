import { useState } from 'react';
import GymSearchForm from './GymSearchForm.jsx';
import VenezuelaMap from './VenezuelaMap.jsx';
import SectionHeader from '../ui/SectionHeader.jsx';
import { FEATURED_CITIES, stateOfCity } from '../../data/venezuela.js';

export default function ExploreSection() {
  const [form, setForm] = useState({ estado: '', ciudad: '', nombre: '' });
  const pickCity = (ciudad) => setForm((f) => ({ ...f, ciudad, estado: stateOfCity(ciudad) }));

  return (
    <section id="explorar" className="section explore" aria-labelledby="explorar-title">
      <div className="container">
        <SectionHeader
          id="explorar-title"
          title="Encuentra tu próximo lugar para entrenar"
          lead="Busca gimnasios afiliados por estado y ciudad, de Maracaibo a Ciudad Guayana."
        />

        <div className="explore-grid">
          <div className="explore-search">
            <GymSearchForm value={form} onChange={setForm} />
            <div className="chips" role="group" aria-label="Ciudades sugeridas">
              {FEATURED_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`chip ${form.ciudad === city ? 'is-active' : ''}`}
                  aria-pressed={form.ciudad === city}
                  onClick={() => pickCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>
            <p className="fine-print">
              Elige una ciudad en el mapa o en las sugerencias y pulsa Buscar. Solo verás gimnasios que se hayan afiliado a Rutine.
            </p>
          </div>
          <VenezuelaMap selected={form.ciudad} onSelect={pickCity} />
        </div>
      </div>
    </section>
  );
}
