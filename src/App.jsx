import { useEffect } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import AffiliationPage from './pages/AffiliationPage.jsx';
import AccessPage from './pages/AccessPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useLocation, ROUTES } from './lib/router.jsx';

const PAGES = {
  [ROUTES.home]: { Component: HomePage, title: 'Rutine · Gimnasios, entrenadores y atletas de Venezuela en una sola plataforma' },
  [ROUTES.explore]: { Component: ExplorePage, title: 'Explorar gimnasios · Rutine' },
  [ROUTES.affiliation]: { Component: AffiliationPage, title: 'Afiliar mi gimnasio · Rutine' },
  [ROUTES.access]: { Component: AccessPage, title: 'Acceder · Rutine' },
};

export default function App() {
  const { path } = useLocation();
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const page = PAGES[normalized] ?? { Component: NotFoundPage, title: 'Página no encontrada · Rutine' };
  const { Component } = page;

  useEffect(() => {
    document.title = page.title;
  }, [page.title]);

  return (
    <>
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
        <Component />
      </main>
      <Footer />
    </>
  );
}
