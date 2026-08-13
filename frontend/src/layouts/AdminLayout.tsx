import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, LayoutDashboard, ListTree, LogOut, Mail, ShieldPlus, ShoppingBag, Users } from 'lucide-react';
import { authApi, getApiError } from '../services/api.ts';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
    <div className="admin-shell">
      <aside>
        <h2>Bên Ncîr Admin</h2>
        <p className="admin-user">{user?.name}</p>
        <NavLink to="/admin" end><LayoutDashboard />Dashboard</NavLink>
        <NavLink to="/admin/products"><Boxes />Produits</NavLink>
        <NavLink to="/admin/categories"><ListTree />Catégories</NavLink>
        <NavLink to="/admin/orders"><ShoppingBag />Commandes</NavLink>
        <NavLink to="/admin/messages"><Mail />Messages</NavLink>
        <NavLink to="/admin/users"><Users />Utilisateurs</NavLink>
        <NavLink to="/admin/users/new-admin"><ShieldPlus />Créer admin</NavLink>
        <button className="admin-logout" onClick={logout} type="button"><LogOut />Déconnexion</button>
      </aside>
      <section><Outlet /></section>
    </div>
  );
}
