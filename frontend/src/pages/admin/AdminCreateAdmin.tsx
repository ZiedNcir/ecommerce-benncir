import { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { authApi } from '../../services/api.ts';

export default function AdminCreateAdmin() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await authApi.createAdmin(form);
      setForm({ name: '', email: '', password: '' });
      setStatus({ type: 'success', message: 'Compte administrateur créé avec succès.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Création impossible.' });
    } finally {
      setLoading(false);
    }
  };

  return <><div className="admin-title-row"><div><h1>Créer un compte admin</h1><p>Interface sécurisée connectée à l’endpoint backend /api/auth/admin.</p></div><ShieldPlus size={42}/></div><form className="admin-panel admin-form" onSubmit={submit}><label>Nom complet<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Mot de passe<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={6} /></label>{status.message ? <p className={status.type === 'success' ? 'success-msg' : 'error-msg'}>{status.message}</p> : null}<button className="btn" disabled={loading}>{loading ? 'Création...' : 'Créer le compte admin'}</button></form></>;
}
