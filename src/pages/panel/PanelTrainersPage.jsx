import { useState } from 'react';
import PanelLayout from '../../components/panel/PanelLayout.jsx';
import TrainerAvatar from '../../components/gym/TrainerAvatar.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useAsync, ProfileSkeleton, ProfileMissing } from '../GymProfilePage.jsx';
import { Link, buildPath, ROUTES } from '../../lib/router.jsx';
import { getPanelGym, panelIsDemo, setTrainerPublic } from '../../services/panelTrainers.js';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'public', label: 'Públicos' },
  { id: 'hidden', label: 'Ocultos' },
  { id: 'inactive', label: 'Inactivos' },
];

export default function PanelTrainersPage({ params }) {
  const [reload, setReload] = useState(0);
  const { status, data: gym, error } = useAsync(() => getPanelGym(params.gymId), [params.gymId, reload]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  if (status === 'loading') return <ProfileSkeleton />;
  if (status === 'error') return <ProfileMissing title="No se pudo cargar el panel" text={error.message} />;
  if (!gym) return <ProfileMissing title="Gimnasio no encontrado" text="Puede que no tengas acceso a este gimnasio." />;

  const editable = gym.isDemo || gym.editable;
  const locName = (id) => gym.locations.find((l) => l.id === id)?.name;
  const list = gym.trainers
    .filter((t) => (filter === 'public' ? t.is_public && t.status === 'active'
      : filter === 'hidden' ? !t.is_public && t.status === 'active'
        : filter === 'inactive' ? t.status === 'inactive' : true))
    .filter((t) => t.full_name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'));

  const togglePublic = async (t) => {
    setBusy(t.id);
    setToast(null);
    try {
      await setTrainerPublic(gym.id, t, !t.is_public);
      setToast({ tone: 'ok', text: !t.is_public ? `${t.full_name} ahora es visible en el perfil del gimnasio.` : `${t.full_name} ya no aparece en el perfil público.` });
      setReload((n) => n + 1);
    } catch (e) {
      setToast({ tone: 'error', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const newHref = buildPath(ROUTES.panelTrainerEdit, { gymId: gym.id, trainerId: 'nuevo' });

  return (
    <PanelLayout gym={gym} active="entrenadores" isDemo={panelIsDemo}>
      <header className="panel-header">
        <div>
          <h1>Entrenadores</h1>
          <p className="muted">{gym.trainers.length} registrados · {gym.trainers.filter((t) => t.is_public && t.status === 'active').length} visibles en tu perfil público</p>
        </div>
        {editable && <Link to={newHref} className="btn btn--primary"><Icon name="plus" size={18} />Registrar entrenador</Link>}
      </header>

      {!editable && (
        <p className="notice notice--warn"><Icon name="info" size={18} />Mientras la solicitud de afiliación está en revisión o el gimnasio está suspendido, no se pueden modificar los entrenadores.</p>
      )}
      {toast && <div className={`notice notice--${toast.tone}`} role="status"><Icon name="info" size={18} /><p>{toast.text}</p></div>}

      <div className="panel-toolbar">
        <div className="segmented" role="group" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} className={filter === f.id ? 'is-on' : ''} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <div className="field toolbar-search">
          <label htmlFor="t-search" className="visually-hidden">Buscar entrenador</label>
          <input id="t-search" type="search" placeholder="Buscar por nombre" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {gym.trainers.length === 0 ? (
        <div className="empty">
          <span className="empty-icon"><Icon name="trainer" size={28} /></span>
          <h2>Aún no has registrado entrenadores</h2>
          <p>Registra a tu equipo para mostrarlo en el perfil del gimnasio y organizar sus horarios.</p>
          {editable && <Link to={newHref} className="btn btn--primary">Registrar el primero</Link>}
        </div>
      ) : list.length === 0 ? (
        <p className="muted">Ningún entrenador coincide con el filtro.</p>
      ) : (
        <ul className="panel-list">
          {list.map((t) => (
            <li key={t.id} className="panel-row">
              <TrainerAvatar trainer={t} size="sm" />
              <div className="panel-row-main">
                <strong>{t.full_name}</strong>
                <span>{t.specialties.join(', ') || 'Sin especialidades'}</span>
                <span className="muted">{t.location_ids.map(locName).filter(Boolean).join(', ') || 'Sin sede asignada'}</span>
              </div>
              <div className="panel-row-status">
                {t.status === 'inactive' ? (
                  <span className="status status--neutral">Inactivo</span>
                ) : t.is_public ? (
                  <span className="status status--paid">Público</span>
                ) : (
                  <span className="status status--due">Oculto</span>
                )}
              </div>
              <div className="panel-row-actions">
                {editable && t.status === 'active' && (
                  <button type="button" className="btn btn--small btn--ghost" disabled={busy === t.id} onClick={() => togglePublic(t)}
                    aria-label={t.is_public ? `Ocultar a ${t.full_name} del perfil público` : `Mostrar a ${t.full_name} en el perfil público`}>
                    <Icon name={t.is_public ? 'eyeOff' : 'eye'} size={16} />{t.is_public ? 'Ocultar' : 'Publicar'}
                  </button>
                )}
                <Link className="btn btn--small btn--ghost" to={buildPath(ROUTES.panelTrainerEdit, { gymId: gym.id, trainerId: t.id })}
                  aria-label={`Editar a ${t.full_name}`}>
                  <Icon name="edit" size={16} />{editable ? 'Editar' : 'Ver'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelLayout>
  );
}
