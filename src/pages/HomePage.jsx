import { useEffect } from 'react';
import Hero from '../components/landing/Hero.jsx';
import ExploreSection from '../components/landing/ExploreSection.jsx';
import BenefitsSection from '../components/landing/BenefitsSection.jsx';
import ProductDemo from '../components/landing/ProductDemo.jsx';
import TrainersSection from '../components/landing/TrainersSection.jsx';
import AthletesSection from '../components/landing/AthletesSection.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import AffiliationSection from '../components/landing/AffiliationSection.jsx';
import FaqSection from '../components/landing/FaqSection.jsx';
import FinalCta from '../components/landing/FinalCta.jsx';
import { scrollToSection } from '../lib/router.jsx';

export default function HomePage() {
  // Si se entra con /#seccion, desplazarse a esa sección una vez renderizada.
  useEffect(() => {
    const id = window.location.hash.replace(/^#\/?/, '');
    if (id && !id.startsWith('/')) requestAnimationFrame(() => scrollToSection(id));
  }, []);

  return (
    <>
      <Hero />
      <ExploreSection />
      <BenefitsSection />
      <ProductDemo />
      <TrainersSection />
      <AthletesSection />
      <HowItWorks />
      <AffiliationSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
