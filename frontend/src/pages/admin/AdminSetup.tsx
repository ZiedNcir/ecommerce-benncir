import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getApiError } from '../../services/api.ts';

export default function AdminSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: 'Bên Ncîr Admin', email: 'admin@bencir.tn', password: 'password' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.setupAdmin(form);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Création impossible. Si un admin existe déjà, connectez-vous.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="admin-auth-card">
        <div className="auth-brand-mark">B</div><span className="auth-brand-name">BÊN NCÎR <small>PREMIÈRE CONFIGURATION</small></span><h1>Créez votre accès admin</h1>
        <p className="form-note">Cette page fonctionne uniquement si aucun compte admin n’existe encore.</p>
        {error && <p className="form-error">{error}</p>}
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" required />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required type="email" />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mot de passe" required type="password" minLength={6} />
        <button className="btn" disabled={loading} type="submit">{loading ? 'Création...' : 'Créer et entrer'}</button>
      </form>
    </main>
  );
}
