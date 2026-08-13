import { useEffect, useMemo, useState } from 'react';
import { Boxes, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';
import { ordersApi, productsApi, usersApi } from '../../services/api.ts';

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmées',
  preparing: 'Préparation',
  shipped: 'Expédiées',
  delivered: 'Livrées',
  cancelled: 'Annulées',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [analyticsData, productData, userData] = await Promise.all([
        ordersApi.analytics(),
        productsApi.list({ includeInactive: true, limit: 200 }),
        usersApi.list(),
      ]);
      setAnalytics(analyticsData);
      setProducts(Array.isArray(productData) ? productData : productData.items || []);
      setUsers(Array.isArray(userData) ? userData : []);
      setLoading(false);
    }
    loadDashboard();
  }, []);

  const lowStock = useMemo(() => products.filter((product) => Number(product.stock || 0) <= 5).length, [products]);
  const revenue = Number(analytics?.totals?.revenue || 0);
  const orders = Number(analytics?.totals?.orders || 0);
  const averageOrder = Number(analytics?.totals?.averageOrder || 0);
  const maxDailyRevenue = Math.max(...(analytics?.dailyRevenue || []).map((day) => Number(day.revenue || 0)), 1);

  if (loading) {
    return (
      <>
        <h1>Dashboard</h1>
        <div className="admin-card-grid dashboard-grid">
          {[1, 2, 3, 4].map((item) => <div className="admin-stat-card skeleton-card" key={item} />)}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Dashboard</h1>
          <p>Analyse commerciale en temps réel depuis MongoDB : commandes, chiffre d’affaires, produits et clients.</p>
        </div>
      </div>

      <div className="admin-card-grid dashboard-grid">
        <div className="admin-stat-card metric-card"><ShoppingBag /><strong>{orders}</strong><span>Commandes totales</span></div>
        <div className="admin-stat-card metric-card"><Wallet /><strong>{revenue.toFixed(2)} DT</strong><span>Chiffre d’affaires</span></div>
        <div className="admin-stat-card metric-card"><TrendingUp /><strong>{averageOrder.toFixed(2)} DT</strong><span>Panier moyen</span></div>
        <div className="admin-stat-card metric-card"><Users /><strong>{users.length}</strong><span>Utilisateurs</span></div>
      </div>

      <div className="dashboard-layout">
        <div className="admin-panel dashboard-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Revenus sur 14 jours</h2>
              <p>Suivi rapide des ventes enregistrées dans la base.</p>
            </div>
            <b>{Number(analytics?.growth || 0).toFixed(1)}%</b>
          </div>
          <div className="mini-chart">
            {(analytics?.dailyRevenue?.length ? analytics.dailyRevenue : [{ _id: 'Aucun', revenue: 0, orders: 0 }]).map((day) => (
              <div className="mini-bar" key={day._id} title={`${day._id} - ${Number(day.revenue || 0).toFixed(2)} DT`}>
                <span style={{ height: `${Math.max(8, (Number(day.revenue || 0) / maxDailyRevenue) * 100)}%` }} />
                <small>{String(day._id).slice(5)}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel dashboard-side-panel">
          <h2>État boutique</h2>
          <div className="health-row"><Boxes /><span>Produits actifs</span><b>{analytics?.catalog?.products ?? products.filter((p) => p.isActive !== false).length}</b></div><div className="health-row"><Boxes /><span>Catégories principales</span><b>{analytics?.catalog?.categories ?? 0}</b></div><div className="health-row"><Boxes /><span>Sous-catégories</span><b>{analytics?.catalog?.subcategories ?? 0}</b></div>
          <div className="health-row"><Boxes /><span>Stock faible</span><b>{lowStock}</b></div>
          <div className="health-row"><ShoppingBag /><span>Mois courant</span><b>{Number(analytics?.currentMonth?.revenue || 0).toFixed(2)} DT</b></div>
        </div>
      </div>

      <div className="dashboard-layout bottom">
        <div className="admin-panel">
          <h2>Commandes récentes</h2>
          <div className="compact-list">
            {(analytics?.recentOrders || []).map((order) => (
              <div key={order._id}>
                <span><b>{order.orderNumber}</b><small>{order.customer?.fullName || 'Client'}</small></span>
                <strong>{Number(order.total || 0).toFixed(2)} DT</strong>
              </div>
            ))}
            {!analytics?.recentOrders?.length ? <p>Aucune commande récente.</p> : null}
          </div>
        </div>
        <div className="admin-panel">
          <h2>Catégories les plus fournies</h2>
          <div className="status-list">{(analytics?.topCategories || []).map((row) => <div key={row._id}><span>{row.name}</span><b>{row.products} produits</b></div>)}{!analytics?.topCategories?.length ? <p>Aucune donnée catégorie.</p> : null}</div>
          <h2 style={{marginTop:24}}>Commandes par statut</h2>
          <div className="status-list">
            {(analytics?.statusStats || []).map((row) => (
              <div key={row._id}><span>{statusLabels[row._id] || row._id}</span><b>{row.count}</b></div>
            ))}
            {!analytics?.statusStats?.length ? <p>Aucune donnée de statut.</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
