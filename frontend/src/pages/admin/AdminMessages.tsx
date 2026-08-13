import { useEffect, useMemo, useState } from 'react';
import { Mail, MailOpen, Search, Trash2, X } from 'lucide-react';
import { contactApi, getApiError } from '../../services/api.ts';
import Loading from '../../components/Loading.tsx';

const labels = { new: 'Nouveau', read: 'Lu', replied: 'Répondu', archived: 'Archivé' };

export default function AdminMessages() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    contactApi.list({ status }).then((data) => setItems(data.items || [])).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false));
  };
  useEffect(load, [status]);

  const filtered = useMemo(() => items.filter((item) =>
    [item.fullName, item.email, item.phone, item.subject, item.message].join(' ').toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  async function open(item) {
    const detail = await contactApi.one(item._id);
    setSelected(detail);
    setItems((current) => current.map((entry) => entry._id === detail._id ? detail : entry));
  }

  async function updateMessage(id, patch) {
    const updated = await contactApi.update(id, patch);
    setSelected(updated);
    setItems((current) => current.map((item) => item._id === id ? updated : item));
  }

  async function remove(item) {
    if (!window.confirm(`Supprimer le message de ${item.fullName} ?`)) return;
    await contactApi.remove(item._id);
    setItems((current) => current.filter((entry) => entry._id !== item._id));
    if (selected?._id === item._id) setSelected(null);
  }

  return (
    <>
      <div className="admin-title"><div><h1>Messages clients</h1><p>Demandes envoyées depuis le formulaire de contact du site.</p></div></div>
      <div className="admin-card-grid">
        <div className="admin-stat-card"><Mail /><strong>{items.length}</strong><span>Messages affichés</span></div>
        <div className="admin-stat-card"><MailOpen /><strong>{items.filter((item) => item.status === 'new').length}</strong><span>Non lus</span></div>
      </div>
      <div className="admin-panel two">
        <label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, sujet..." /></label>
        <label>Statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      </div>
      {error ? <p className="error-msg">{error}</p> : null}
      {loading ? <Loading /> : <div className="admin-table-wrap"><table>
        <thead><tr><th>Client</th><th>Sujet</th><th>Date</th><th>Statut</th><th></th></tr></thead>
        <tbody>{filtered.map((item) => <tr key={item._id} className={item.status === 'new' ? 'message-unread' : ''}>
          <td><b>{item.fullName}</b><br /><small>{item.email}{item.phone ? ` • ${item.phone}` : ''}</small></td>
          <td>{item.subject}<br /><small>{item.message.slice(0, 90)}{item.message.length > 90 ? '…' : ''}</small></td>
          <td>{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
          <td><span className={`status-badge ${item.status}`}>{labels[item.status]}</span></td>
          <td className="admin-actions"><button className="outline" type="button" onClick={() => open(item)}>Consulter</button><button className="outline danger" type="button" onClick={() => remove(item)}><Trash2 size={16} /></button></td>
        </tr>)}</tbody>
      </table></div>}
      {selected ? <div className="admin-modal-backdrop" onClick={() => setSelected(null)} role="presentation">
        <section className="admin-message-modal" role="dialog" aria-modal="true" aria-label="Détail du message" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Fermer"><X /></button>
          <small>{new Date(selected.createdAt).toLocaleString('fr-FR')}</small>
          <h2>{selected.subject}</h2>
          <p><b>{selected.fullName}</b><br />{selected.email}{selected.phone ? <><br />{selected.phone}</> : null}</p>
          <div className="message-content">{selected.message}</div>
          <label>Statut<select value={selected.status} onChange={(event) => updateMessage(selected._id, { status: event.target.value })}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Note interne<textarea rows={4} value={selected.adminNote || ''} onChange={(event) => setSelected((current) => ({ ...current, adminNote: event.target.value }))} /></label>
          <button className="btn" type="button" onClick={() => updateMessage(selected._id, { adminNote: selected.adminNote || '' })}>Enregistrer</button>
          <a className="outline" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Réponse : ${selected.subject}`)}`}>Répondre par email</a>
        </section>
      </div> : null}
    </>
  );
}
