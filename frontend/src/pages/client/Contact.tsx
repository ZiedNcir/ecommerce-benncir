import { useState } from 'react';
import { Clock3, Mail, MapPin, MessageCircle, Phone, Send, Smartphone, Truck, CheckCircle2 } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import BenefitBar from '../../components/BenefitBar.tsx';
import { contactApi, getApiError } from '../../services/api.ts';

const contactCards = [
  { icon: Phone, title: 'Téléphone', main: '+216 24 037 404', sub: 'Disponible 24/7' },
  { icon: Mail, title: 'Email', main: 'benncircommerce@gmail.com', sub: 'Réponse sous 24h' },
  { icon: MapPin, title: 'Adresse', main: 'Rue Habib Bourguiba, Immeuble Zitouna', sub: 'Tunis, Tunisie' },
  { icon: Clock3, title: 'Horaires', main: 'Lundi – Dimanche : 08h00 – 20h00', sub: 'Sans interruption' },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await contactApi.create(form);
      setSent(true);
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
    } catch (submitError) {
      setError(getApiError(submitError, 'Impossible d’envoyer le message.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: 'Contact' }]} />

      <section className="contact-hero">
        <div>
          <span className="section-kicker">Assistance client</span>
          <h1>Contactez-nous</h1>
          <p>Une question, un conseil ou un besoin d’assistance ? Notre équipe est disponible pour vous accompagner avant et après votre commande.</p>
        </div>
        <div className="contact-hero-card"><Truck /><span><b>Livraison partout en Tunisie</b><small>Suivi, assistance et service client réactif</small></span></div>
      </section>

      <section className="contact-layout">
        <aside className="contact-info-list">
          {contactCards.map(({ icon: Icon, title, main, sub }) => <article key={title}><Icon /><div><h3>{title}</h3><b>{main}</b><small>{sub}</small></div></article>)}
        </aside>

        <form className="contact-form" onSubmit={submit}>
          {sent ? <div className="form-success"><CheckCircle2 size={38} /><h2>Message envoyé</h2><p>Votre demande a été enregistrée. Notre équipe pourra la consulter et la traiter depuis le dashboard.</p><button type="button" className="outline wide" onClick={() => setSent(false)}>Envoyer un autre message</button></div> : <>
            <h2>Envoyez-nous un message</h2>
            <label>Nom complet<input required name="fullName" value={form.fullName} onChange={change} maxLength={120} placeholder="Votre nom complet" /></label>
            <label>Email<input required name="email" value={form.email} onChange={change} type="email" maxLength={180} placeholder="Votre adresse email" /></label>
            <label>Téléphone (facultatif)<input name="phone" value={form.phone} onChange={change} maxLength={40} placeholder="+216 ..." /></label>
            <label>Sujet<select required name="subject" value={form.subject} onChange={change}><option value="" disabled>Choisissez un sujet</option><option>Commande</option><option>Livraison</option><option>Retour produit</option><option>Autre demande</option></select></label>
            <label>Message<textarea required name="message" value={form.message} onChange={change} maxLength={3000} rows={5} placeholder="Votre message..." /></label>
            {error ? <p className="error-msg">{error}</p> : null}
            <button className="btn wide" disabled={submitting} type="submit"><Send size={18} /> {submitting ? 'Envoi...' : 'Envoyer le message'}</button>
          </>}
        </form>

        <div className="contact-map-social">
          <div className="map-card"><img src="https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+dc9700(10.1815,36.8065)/10.1815,36.8065,13,0/760x440?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpdjV1eXpjdjAwMmoyam9sNDRkYXl2ZGoifQ.5fI31NnuwA4eH6X4f1Jm9A" alt="Carte localisation Tunis" /><div><MapPin /><b>BÊN NCÎR COMMERCE</b><small>Tunis, Tunisie</small></div></div>
          <div className="social-card"><h2>Suivez-nous</h2><p>Restez connecté pour découvrir nos nouveautés, offres exclusives et conseils.</p><div className="social-buttons"><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><span>f</span></a><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><span>◎</span></a><a href="https://wa.me/21624037404" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a><a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"><Smartphone /></a></div></div>
        </div>
      </section>

      <BenefitBar />
    </>
  );
}
