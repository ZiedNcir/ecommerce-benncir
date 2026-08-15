import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { usersApi } from '../../services/api.ts';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { usersApi.list().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false)); }, []);
  const updateRole = async (id, role) => { const updated = await usersApi.updateRole(id, { role }); setUsers((current) => current.map((user) => user._id === id ? updated : user)); };
  return <><div className="admin-title-row"><div><span className="eyebrow">Administration</span><h1>Utilisateurs</h1><p>Gestion des clients et administrateurs depuis MongoDB.</p></div><Link className="btn" to="/admin/users/new-admin"><ShieldPlus/>Créer admin</Link></div><div className="admin-card-grid"><div className="admin-stat-card metric-card"><div className="metric-top"><span>Total utilisateurs</span><ShieldPlus/></div><strong>{users.length}</strong><span className="metric-foot">Comptes enregistrés</span></div><div className="admin-stat-card metric-card"><div className="metric-top"><span>Clients</span><ShieldPlus/></div><strong>{users.filter((user) => user.role === 'client').length}</strong><span className="metric-foot">Accès boutique</span></div><div className="admin-stat-card metric-card"><div className="metric-top"><span>Administrateurs</span><ShieldPlus/></div><strong>{users.filter((user) => user.role === 'admin').length}</strong><span className="metric-foot">Accès dashboard</span></div></div><div className="admin-panel"><div className="panel-head"><div><h2>Comptes utilisateurs</h2><p>Modifiez les rôles avec précaution.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Créé le</th></tr></thead><tbody>{loading ? <tr><td colSpan={4}>Chargement...</td></tr> : users.map((user) => <tr key={user._id}><td><b>{user.name}</b></td><td>{user.email}</td><td><select value={user.role} onChange={(event) => updateRole(user._id, event.target.value)}><option value="client">client</option><option value="admin">admin</option></select></td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}</td></tr>)}</tbody></table></div></div></>;
}
