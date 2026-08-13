import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Search, Trash2 } from 'lucide-react';
import { ordersApi } from '../../services/api.ts';

const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
const labels = { pending: 'En attente', confirmed: 'Confirmée', preparing: 'Préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    ordersApi.list({ status }).then((data) => setItems(Array.isArray(data) ? data : data.items || [])).catch(() => setItems([]));
  }, [status]);

  const filtered = useMemo(() => items.filter((order) => [order.orderNumber, order.customer?.fullName, order.customer?.phone, order.customer?.email].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function updateStatus(order, nextStatus) {
    const previousStatus = order.status;
    setError('');
    setItems((current) => current.map((item) => item._id === order._id ? { ...item, status: nextStatus } : item));
    try {
      const updated = await ordersApi.update(order._id, { status: nextStatus });
      setItems((current) => current.map((item) => item._id === order._id ? { ...item, ...updated } : item));
    } catch (requestError) {
      setItems((current) => current.map((item) => item._id === order._id ? { ...item, status: previousStatus } : item));
      setError(requestError.response?.data?.message || 'Le statut n’a pas pu être modifié.');
    }
  }

  async function remove(order) {
    if (!window.confirm(`Supprimer définitivement la commande ${order.orderNumber || order._id} ?`)) return;
    await ordersApi.remove(order._id);
    setItems((current) => current.filter((item) => item._id !== order._id));
  }

  return (
    <>
      <div className="admin-title"><div><h1>Commandes</h1><p>Chaque commande est stockée en base et envoyée par email à l’administrateur si SMTP est configuré.</p></div></div>
      <div className="admin-card-grid">
        <div className="admin-stat-card"><PackageCheck /><strong>{items.length}</strong><span>Total commandes</span></div>
        <div className="admin-stat-card"><strong>{items.filter((item) => item.status === 'pending').length}</strong><span>En attente</span></div>
        <div className="admin-stat-card"><strong>{items.reduce((sum, item) => sum + Number(item.total || 0), 0).toFixed(2)} DT</strong><span>Chiffre commandes</span></div>
      </div>
      <div className="admin-panel two">
        <label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Référence, client, téléphone..." /></label>
        <label>Statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option>{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
      </div>
      {error ? <p className="error-msg">{error}</p> : null}
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Client</th><th>Livraison</th><th>Total</th><th>Paiement</th><th>Status</th><th>Email admin</th><th></th></tr></thead>
          <tbody>{filtered.map((order) => <tr key={order._id || order.orderNumber}>
            <td><b>{order.orderNumber || order._id}</b><br /><small>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</small></td>
            <td>{order.customer?.fullName || order.user?.name || 'Client'}<br /><small>{order.customer?.phone || order.customer?.email}</small></td>
            <td>{order.delivery?.label || 'Livraison à domicile'}<br /><small>{Number(order.delivery?.fee ?? order.deliveryFee ?? 0).toFixed(2)} DT</small></td>
            <td><b>{Number(order.total || order.totalPrice || 0).toFixed(2)} DT</b></td>
            <td>À la livraison</td>
            <td><select className="admin-status-select" value={order.status || 'pending'} onChange={(event) => updateStatus(order, event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></td>
            <td>{order.adminEmailSent ? 'Envoyé' : order.adminEmailError ? 'Erreur' : 'En attente'}</td>
            <td className="admin-actions"><Link className="outline" to={`/admin/orders/${order._id}`}>Détails</Link><button className="outline danger" type="button" onClick={() => remove(order)}><Trash2 size={16} /> Supprimer</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
