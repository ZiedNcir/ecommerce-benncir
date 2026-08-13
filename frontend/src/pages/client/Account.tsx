import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, UserRound, ShoppingBag, Heart, MapPin } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';

export default function Account() {
  const [mode, setMode] = useState('login');
  const [connected, setConnected] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setConnected(true);
  };

  if (connected) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Mon compte' }]} />
        <section className="account-dashboard">
          <div className="account-welcome">
            <UserRound size={44} />
            <div><h1>Bienvenue, Client Demo</h1><p>Votre espace client est prêt pour la validation front. Les données seront branchées au backend après validation.</p></div>
          </div>
          <div className="account-cards">
            <Link to="/cart"><ShoppingBag /><b>Mes commandes</b><span>Voir le panier et les commandes demo</span></Link>
            <Link to="/favorites"><Heart /><b>Mes favoris</b><span>Retrouver les produits enregistrés</span></Link>
            <Link to="/checkout"><MapPin /><b>Mes adresses</b><span>Finaliser une commande test</span></Link>
          </div>
          <button className="outline" onClick={() => setConnected(false)}>Se déconnecter</button>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Mon compte' }]} />
      <section className="auth-client-page">
        <div className="auth-client-copy">
          <span className="section-kicker">Espace client</span>
          <h1>{mode === 'login' ? 'Connectez-vous à votre compte.' : 'Créez votre compte client.'}</h1>
          <p>Suivez vos commandes, gérez vos favoris et gagnez du temps lors de vos prochains achats.</p>
        </div>
        <form className="auth-client-card" onSubmit={submit}>
          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Inscription</button>
          </div>
          {mode === 'register' && <label>Nom complet<input required placeholder="Votre nom" /></label>}
          <label><Mail size={16} /> Email<input required type="email" defaultValue="client@example.com" /></label>
          <label><Lock size={16} /> Mot de passe<input required type="password" defaultValue="demo1234" /></label>
          <button className="btn wide" type="submit">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
          <small>Compte demo local pour tester le parcours frontend.</small>
        </form>
      </section>
    </>
  );
}
