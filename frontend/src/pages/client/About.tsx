import { Link } from 'react-router-dom';
import { Award, Boxes, Headphones, HeartHandshake, PackageCheck, RefreshCcw, ShieldCheck, Star, Truck } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import BenefitBar from '../../components/BenefitBar.tsx';

const features = [
  { icon: Award, title: 'Qualité garantie', text: 'Des produits sélectionnés avec soin pour proposer une expérience fiable.' },
  { icon: ShieldCheck, title: 'Paiement sécurisé', text: 'Commande protégée et paiement à la livraison disponible.' },
  { icon: Truck, title: 'Livraison rapide', text: 'Expédition partout en Tunisie avec suivi client.' },
  { icon: Headphones, title: 'Service client 24/7', text: 'Une équipe disponible pour accompagner chaque client.' },
  { icon: RefreshCcw, title: 'Retours faciles', text: 'Un parcours clair pour les échanges et retours.' },
];

export default function About() {
  return (
    <>
      <Breadcrumb items={[{ label: 'À propos' }]} />

      <section className="about-hero">
        <div className="about-copy">
          <span className="section-kicker">Notre histoire</span>
          <h1>À propos de <span>BÊN NCÎR COMMERCE</span></h1>
          <p>
            BÊN NCÎR COMMERCE est une boutique en ligne pensée pour faciliter l’achat de produits du quotidien en Tunisie : électronique, maison, beauté, mode, sport et accessoires.
          </p>
          <p>
            Notre objectif est simple : proposer une expérience d’achat claire, rapide et rassurante, avec un service client accessible et une livraison partout en Tunisie.
          </p>
          <div className="about-metrics">
            <div><b>10K+</b><small>Clients satisfaits</small></div>
            <div><b>5K+</b><small>Produits disponibles</small></div>
            <div><b>99%</b><small>Avis positifs</small></div>
            <div><b>24/7</b><small>Support dédié</small></div>
          </div>
        </div>

        <div className="about-visual">
          <img src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85" alt="Espace moderne BÊN NCÎR COMMERCE" />
          <div className="about-floating-panel">
            <div><PackageCheck /><span><b>Produits de qualité</b><small>Sélectionnés avec soin</small></span></div>
            <div><ShieldCheck /><span><b>Paiement sécurisé</b><small>100% sécurisé</small></span></div>
            <div><Truck /><span><b>Livraison rapide</b><small>Partout en Tunisie</small></span></div>
            <div><HeartHandshake /><span><b>Service client</b><small>Toujours à votre écoute</small></span></div>
          </div>
        </div>
      </section>

      <section className="why-panel">
        <div className="why-title">
          <span className="section-kicker">Pourquoi nous choisir</span>
          <h2>BÊN NCÎR <span>COMMERCE</span></h2>
        </div>
        <div className="why-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-values">
        <article>
          <Star />
          <h3>Expérience premium</h3>
          <p>Une interface moderne, des catégories lisibles, des produits bien présentés et un parcours d’achat simple.</p>
        </article>
        <article>
          <Boxes />
          <h3>Large choix</h3>
          <p>Des univers variés pour répondre aux besoins de toute la famille, du high-tech à la maison.</p>
        </article>
        <article>
          <Headphones />
          <h3>Accompagnement</h3>
          <p>Une relation client claire avant, pendant et après la commande.</p>
        </article>
      </section>

      <section className="about-cta">
        <div>
          <span className="section-kicker">Besoin d’aide ?</span>
          <h2>Notre équipe est là pour vous accompagner.</h2>
        </div>
        <Link to="/contact" className="btn">Contacter le support</Link>
      </section>

      <BenefitBar />
    </>
  );
}
