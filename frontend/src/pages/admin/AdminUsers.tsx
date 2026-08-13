import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { usersApi } from '../../services/api.ts';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { usersApi.list().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false)); }, []);
  const updateRole = async (id, role) => { const updated = await usersApi.updateRole(id, { role }); setUsers((current) => current.map((user) => user._id === id ? updated : user)); };
  return <><div className="admin-title-row"><div><h1>Utilisateurs</h1><p>Gestion des clients et administrateurs depuis MongoDB.</p></div><Link className="btn" to="/admin/users/new-admin"><ShieldPlus/>Créer admin</Link></div><div className="admin-panel"><table className="admin-table"><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Créé le</th></tr></thead><tbody>{loading ? <tr><td colSpan={4}>Chargement...</td></tr> : users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td><select value={user.role} onChange={(event) => updateRole(user._id, event.target.value)}><option value="client">client</option><option value="admin">admin</option></select></td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}</td></tr>)}</tbody></table></div></>;
}
