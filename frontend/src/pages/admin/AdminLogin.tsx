import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, getApiError } from '../../services/api.ts';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: 'admin@bencir.tn', password: 'password' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(form);
      if (response.user?.role !== 'admin') {
        setError('Ce compte existe, mais il n’a pas les droits administrateur.');
        return;
      }
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <h1>Admin Login</h1>
        {params.get('session') === 'expired' && <p className="form-note">Session expirée. Connectez-vous à nouveau.</p>}
        {params.get('role') === 'denied' && <p className="form-note">Accès réservé aux administrateurs.</p>}
        {error && <p className="form-error">{error}</p>}
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email admin"
          type="email"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Mot de passe"
        />
        <button className="btn" disabled={loading} type="submit">{loading ? 'Connexion...' : 'Connexion'}</button>
        <Link className="setup-link" to="/admin/setup">Créer le premier admin</Link>
      </form>
    </main>
  );
}
