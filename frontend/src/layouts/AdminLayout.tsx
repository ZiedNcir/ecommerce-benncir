import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ChevronDown, LayoutDashboard, ListTree, LogOut, Mail, Menu, ShieldPlus, ShoppingBag, Users, X } from 'lucide-react';
import { authApi, getApiError } from '../services/api.ts';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    authApi
      .me()
      .then((profile) => {
        if (profile.role !== 'admin') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/admin/login?role=denied', { replace: true });
          return;
        }
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
        setLoading(false);
      })
      .catch((error) => {
        console.warn(getApiError(error));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login?session=expired', { replace: true });
      });
  }, [navigate]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login', { replace: true });
  }

  if (loading) return <main className="admin-loading">Chargement du dashboard...</main>;

  return (
    <div className={`admin-shell ${mobileNavOpen ? 'nav-open' : ''}`}>
      <div className="admin-mobile-bar"><button type="button" className="admin-icon-button" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Ouvrir le menu">{mobileNavOpen ? <X /> : <Menu />}</button><span>BÊN NCÎR <small>ADMIN</small></span><div className="admin-mobile-avatar">{user?.name?.charAt(0) || 'A'}</div></div>
      {mobileNavOpen ? <button className="admin-nav-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setMobileNavOpen(false)} /> : null}
      <aside>
        <div className="admin-brand"><div className="admin-brand-mark">B</div><div><strong>BÊN NCÎR</strong><span>Commerce Admin</span></div></div>
        <div className="admin-profile"><div className="admin-avatar">{user?.name?.charAt(0) || 'A'}</div><div><b>{user?.name || 'Administrateur'}</b><span>Administrateur</span></div><ChevronDown size={15} /></div>
        <p className="admin-nav-label">Vue générale</p>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin" end><LayoutDashboard />Dashboard</NavLink>
        <p className="admin-nav-label">Gestion boutique</p>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/products"><Boxes />Produits</NavLink>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/categories"><ListTree />Catégories</NavLink>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/orders"><ShoppingBag />Commandes</NavLink>
        <p className="admin-nav-label">Administration</p>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/messages"><Mail />Messages</NavLink>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/users"><Users />Utilisateurs</NavLink>
        <NavLink onClick={() => setMobileNavOpen(false)} to="/admin/users/new-admin"><ShieldPlus />Créer admin</NavLink>
        <button className="admin-logout" onClick={logout} type="button"><LogOut />Déconnexion</button>
      </aside>
      <section className="admin-content"><Outlet /></section>
    </div>
  );
}
