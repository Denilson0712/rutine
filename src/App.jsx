import { useLayoutEffect } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import GymProfilePage from './pages/GymProfilePage.jsx';
import TrainerProfilePage from './pages/TrainerProfilePage.jsx';
import AffiliationPage from './pages/AffiliationPage.jsx';
import AccessPage from './pages/AccessPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PanelHomePage from './pages/panel/PanelHomePage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import PanelTrainersPage from './pages/panel/PanelTrainersPage.jsx';
import PanelTrainerEditPage from './pages/panel/PanelTrainerEditPage.jsx';
import RequireGymAdmin from './auth/RequireGymAdmin.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { useLocation, ROUTES } from './lib/router.jsx';
import { resolveRoute } from './lib/routeMatch.js';

const TITLE_SUFFIX = ' · Rutine';

/** Tabla de rutas. Las rutas públicas originales se conservan sin cambios. */
const ROUTE_TABLE = [
  { path: ROUTES.home, Component: HomePage, title: 'Rutine · Gimnasios, entrenadores y atletas de Venezuela en una sola plataforma' },
  { path: ROUTES.explore, Component: ExplorePage, title: `Explorar gimnasios${TITLE_SUFFIX}` },
  { path: ROUTES.gymProfile, Component: GymProfilePage, title: `Gimnasio${TITLE_SUFFIX}` },
  { path: ROUTES.trainerProfile, Component: TrainerProfilePage, title: `Entrenador${TITLE_SUFFIX}` },
  { path: ROUTES.affiliation, Component: AffiliationPage, title: `Afiliar mi gimnasio${TITLE_SUFFIX}` },
  { path: ROUTES.access, Component: AccessPage, title: `Acceder${TITLE_SUFFIX}` },
  { path: ROUTES.resetPassword, Component: ResetPasswordPage, title: `Restablecer contraseña${TITLE_SUFFIX}` },
  { path: ROUTES.account, Component: AccountPage, title: `Mi cuenta${TITLE_SUFFIX}` },
  { path: ROUTES.panel, Component: PanelHomePage, title: `Mis gimnasios${TITLE_SUFFIX}`, panel: true },
  { path: ROUTES.panelTrainers, Component: PanelTrainersPage, title: `Entrenadores · Panel${TITLE_SUFFIX}`, panel: true, guard: true },
  { path: ROUTES.panelTrainerEdit, Component: PanelTrainerEditPage, title: `Entrenador · Panel${TITLE_SUFFIX}`, panel: true, guard: true },
];

function Routes() {
  const { path } = useLocation();
  const match = resolveRoute(ROUTE_TABLE, path);
  const route = match?.route ?? { Component: NotFoundPage, title: `Página no encontrada${TITLE_SUFFIX}` };
  const params = match?.params ?? {};
  const { Component } = route;

  // useLayoutEffect corre antes que los efectos de las páginas, que pueden
  // afinar el título con datos cargados (nombre del gimnasio o del entrenador).
  useLayoutEffect(() => {
    document.title = route.title;
  }, [route.title, path]);

  const page = <Component params={params} />;
  return route.guard ? <RequireGymAdmin gymId={params.gymId}>{page}</RequireGymAdmin> : page;
}

export default function App() {
  return (
    <AuthProvider>
      <a
        className="skip-link"
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('contenido')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" tabIndex={-1}>
        <Routes />
      </main>
      <Footer />
    </AuthProvider>
  );
}
