import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Boxes, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Mail, PackageCheck, Plus, RefreshCw, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';
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
  const pendingOrders = Number(analytics?.statusStats?.find((item) => item._id === 'pending')?.count || 0);
  const unreadMessages = Number(analytics?.unreadMessages || 0);
  const inactiveProducts = products.filter((product) => product.isActive === false).length;

  if (loading) {
    return (
      <>
        <div className="admin-title"><div><span className="eyebrow">Vue générale</span><h1>Dashboard</h1></div></div>
        <div className="admin-card-grid dashboard-grid">
          {[1, 2, 3, 4].map((item) => <div className="admin-stat-card skeleton-card" key={item} />)}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-title dashboard-heading">
        <div>
          <span className="eyebrow">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>Bonjour, {JSON.parse(localStorage.getItem('user') || 'null')?.name?.split(' ')[0] || 'Admin'} <span>👋</span></h1>
          <p>Voici ce qui se passe dans votre boutique aujourd’hui.</p>
        </div>
        <div className="dashboard-actions"><button className="outline" type="button" onClick={() => window.location.reload()}><RefreshCw size={16}/>Actualiser</button><a className="btn" href="/admin/products/new"><Plus size={16}/>Ajouter un produit</a></div>
      </div>

      <div className="admin-card-grid dashboard-grid">
        <div className="admin-stat-card metric-card metric-revenue"><div className="metric-top"><span>Chiffre d’affaires</span><CircleDollarSign /></div><strong>{revenue.toFixed(2)} <small>DT</small></strong><span className="metric-foot"><TrendingUp size={14}/> {Number(analytics?.growth || 0).toFixed(1)}% ce mois-ci</span></div>
        <div className="admin-stat-card metric-card"><div className="metric-top"><span>Commandes totales</span><ShoppingBag /></div><strong>{orders}</strong><span className="metric-foot">{pendingOrders} en attente de traitement</span></div>
        <div className="admin-stat-card metric-card"><div className="metric-top"><span>Panier moyen</span><Wallet /></div><strong>{averageOrder.toFixed(2)} <small>DT</small></strong><span className="metric-foot">Par commande confirmée</span></div>
        <div className="admin-stat-card metric-card"><div className="metric-top"><span>Clients inscrits</span><Users /></div><strong>{users.length}</strong><span className="metric-foot">Base clients active</span></div>
      </div>

      <div className="dashboard-alerts"><div className="section-label"><span>À surveiller</span><small>Actions prioritaires</small></div><div className="alert-grid"><div className={lowStock ? 'dashboard-alert warning' : 'dashboard-alert success'}>{lowStock ? <AlertTriangle /> : <CheckCircle2 />}<span><b>{lowStock || 'Aucun'} produit{lowStock > 1 ? 's' : ''} en stock faible</b><small>{lowStock ? 'Vérifiez le stock avant les prochaines commandes.' : 'Votre inventaire est à jour.'}</small></span><ChevronRight /></div><div className={pendingOrders ? 'dashboard-alert info' : 'dashboard-alert success'}><PackageCheck /><span><b>{pendingOrders || 'Aucune'} commande en attente</b><small>{pendingOrders ? 'Une action est nécessaire dans les commandes.' : 'Toutes les commandes sont traitées.'}</small></span><ChevronRight /></div><div className="dashboard-alert neutral"><Mail /><span><b>{unreadMessages || 'Aucun'} message non lu</b><small>Les demandes clients récentes apparaissent ici.</small></span><ChevronRight /></div><div className="dashboard-alert neutral"><Boxes /><span><b>{inactiveProducts || 'Aucun'} produit inactif</b><small>Produits masqués du catalogue public.</small></span><ChevronRight /></div></div></div>

      <div className="dashboard-layout">
        <div className="admin-panel dashboard-chart-panel">
          <div className="panel-head">
            <div>
              <h2>Revenus sur 14 jours</h2>
              <p>Suivi rapide des ventes enregistrées dans la base.</p>
            </div>
            <b className={Number(analytics?.growth || 0) >= 0 ? 'growth-positive' : 'growth-negative'}><TrendingUp size={15}/>{Number(analytics?.growth || 0).toFixed(1)}%</b>
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
