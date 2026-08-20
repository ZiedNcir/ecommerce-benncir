import { useState } from 'react';
import { ArrowRight, Check, Home, Info, MailCheck, MailWarning, PackageCheck, Phone, ShoppingBag, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import BenefitBar from '../../components/BenefitBar.tsx';
import { useCartStore } from '../../store/cartStore.ts';
import { ordersApi } from '../../services/api.ts';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.tsx';

const DELIVERY_FEE = 8;

// Tunisian governorates with their cities
const TUNISIAN_GOVERNORATES = {
  'Tunis': ['Tunis', 'El Menzah', 'Le Kram', 'La Goulette', 'Carthage', 'Sidi Bou Said'],
  'Ariana': ['Ariana', 'Raoued', 'Sidi Thabet', 'La Soukra', 'Ennasr', 'El Ghazala'],
  'Ben Arous': ['Ben Arous', 'Mornag', 'Mohamedia', 'Fouchana', 'Rades', 'Megrine'],
  'Manouba': ['Manouba', 'Mornaguia', 'Oued Ellil', 'Jedaida', 'Tebourba'],
  'Nabeul': ['Nabeul', 'Hammamet', 'Kelibia', 'Korba', 'Beni Khalled', 'Menzel Temime'],
  'Zaghouan': ['Zaghouan', 'Nadhour', 'El Fahs', 'Bir Mcherga'],
  'Bizerte': ['Bizerte', 'Menzel Bourguiba', 'Ras Jebel', 'Mateur', 'Ghar El Melh'],
  'Beja': ['Beja', 'Medjez El Bab', 'Testour', 'Nefza', 'Teboursouk'],
  'Jendouba': ['Jendouba', 'Tabarka', 'Ain Draham', 'Fernana', 'Bou Salem'],
  'Kef': ['Le Kef', 'Tajerouine', 'Sakiet Sidi Youssef', 'Jerissa'],
  'Siliana': ['Siliana', 'Makthar', 'Rouhia', 'Kesra'],
  'Kairouan': ['Kairouan', 'Haffouz', 'Oueslatia', 'Menzel Mehiri'],
  'Kasserine': ['Kasserine', 'Sbeitla', 'Feriana', 'Foussana', 'Thala'],
  'Sidi Bouzid': ['Sidi Bouzid', 'Meknassy', 'Regueb', 'Jilma'],
  'Sousse': ['Sousse', 'Msaken', 'Kalâa Kebira', 'Akouda', 'Hammam Sousse'],
  'Monastir': ['Monastir', 'Moknine', 'Sahline', 'Khniss', 'Beni Hassen'],
  'Mahdia': ['Mahdia', 'El Jem', 'Ksour Essef', 'Melloulech', 'Chebba'],
  'Sfax': ['Sfax', 'Mahrès', 'Agareb', 'Sakiet Ezzit', 'Skhira'],
  'Gafsa': ['Gafsa', 'Métlaoui', 'Redeyef', 'Mdhilla', 'El Ksar'],
  'Tozeur': ['Tozeur', 'Nefta', 'Degache', 'Hazoua'],
  'Kebili': ['Kebili', 'Douz', 'Souk Lahad', 'Jemna'],
  'Gabès': ['Gabès', 'Mareth', 'Matmata', 'Médenine', 'Zarzis'],
  'Medenine': ['Medenine', 'Djerba', 'Ben Gardane', 'Tataouine', 'Ajim'],
  'Tataouine': ['Tataouine', 'Remada', 'Bir Lahmar', 'Ghomrassen']
};

export default function Checkout() {
  const { items, subtotal, clear } = useCartStore();
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    governorate: '',
    postalCode: '',
    note: '',
  });
  const deliveryFee = DELIVERY_FEE;
  const total = Math.max(0, subtotal() + deliveryFee);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleGovernorateChange = (event) => {
    const { value } = event.target;
    setForm((current) => ({ 
      ...current, 
      governorate: value,
      city: '' // Reset city when governorate changes
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      customer: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        governorate: form.governorate,
        postalCode: form.postalCode,
        country: 'Tunisie',
      },
      items: items.map((item) => ({ product: item._id, quantity: item.qty })),
      note: form.note,
    };

    setSubmitError('');
    setSubmitting(true);
    try {
      const order = await ordersApi.create(payload);
      setConfirmedOrder(order);
      clear();
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Impossible d\'enregistrer la commande. Vérifiez la connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const reference = confirmedOrder.orderNumber || confirmedOrder._id || 'BNC-CMD-DEMO';
    return (
      <div className="order-confirmation-page">
        <div className="order-confirmation-card">
          <section className="order-confirmation-hero">
            <div className="order-confirmation-badge"><Check size={38} /></div>
            <h1>Commande confirmée</h1>
            <p>Merci pour votre achat. Votre commande a bien été enregistrée. Notre équipe va vous contacter avant la livraison à domicile.</p>
            <div className="order-ref"><PackageCheck size={18} /> Référence : {reference}</div>
            <div className={`order-email-result ${confirmedOrder.adminEmailSent ? 'sent' : 'warning'}`}>
              {confirmedOrder.adminEmailSent ? <MailCheck size={18} /> : <MailWarning size={18} />}
              <span>{confirmedOrder.adminEmailSent ? 'Notification envoyée à benncircommerce@gmail.com' : 'Commande enregistrée — notification email à vérifier dans le dashboard'}</span>
            </div>
          </section>

          <section className="order-confirmation-body">
            <div className="confirmation-panel">
              <h2>Résumé de la commande</h2>
              <div className="confirmation-row"><span>Client</span><b>{confirmedOrder.customer?.fullName || form.fullName}</b></div>
              <div className="confirmation-row"><span>Téléphone</span><b>{confirmedOrder.customer?.phone || form.phone}</b></div>
              <div className="confirmation-row"><span>Adresse</span><b>{confirmedOrder.customer?.address || form.address}</b></div>
              <div className="confirmation-row"><span>Méthode de livraison</span><b>Livraison à domicile</b></div>
              <div className="confirmation-row"><span>Frais de livraison</span><b>8,00 DT</b></div>
              <div className="confirmation-row"><span>Paiement</span><b>À la livraison</b></div>
              <div className="confirmation-row"><span>Total</span><b>{Number(confirmedOrder.total || total).toFixed(2)} DT</b></div>
              <div className="confirmation-actions">
                <Link className="btn" to="/products"><ShoppingBag size={18} /> Continuer mes achats</Link>
                <Link className="outline" to="/contact"><Phone size={18} /> Contacter la boutique</Link>
              </div>
            </div>

            <div className="confirmation-panel">
              <h2>Prochaines étapes</h2>
              <div className="timeline">
                <div className="timeline-step active"><div className="timeline-dot">1</div><div><b>Commande reçue</b><p>Votre commande est stockée et transmise à l\'administrateur.</p></div></div>
                <div className="timeline-step"><div className="timeline-dot">2</div><div><b>Confirmation téléphone</b><p>Nous validons les détails avec vous avant préparation.</p></div></div>
                <div className="timeline-step"><div className="timeline-dot">3</div><div><b>Livraison à domicile</b><p>Livraison unique disponible : domicile, frais fixes 8 DT.</p></div></div>
                <div className="timeline-step"><div className="timeline-dot">4</div><div><b>Paiement à réception</b><p>Vous payez en espèces au moment de recevoir la commande.</p></div></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const governorates = Object.keys(TUNISIAN_GOVERNORATES);
  
  return (
    <>
      <Breadcrumb items={[{ label: 'Panier', href: '/cart' }, { label: 'Commander' }]} />
      <h1>Passer à la caisse</h1>
      <p>Veuillez remplir vos informations. La livraison disponible est la livraison à domicile.</p>
      <div className="steps"><span className="active">1 Informations</span><span>2 Livraison</span><span>3 Vérification</span><span>4 Confirmation</span></div>
      <form onSubmit={handleSubmit} className="checkout-layout">
        <section className="checkout-form">
          <div>
            <h2>Informations de contact</h2>
            <label>Adresse e-mail *
              <input 
                required 
                type="email"
                name="email" 
                value={form.email} 
                onChange={handleChange} 
              />
            </label>
            <label>Numéro de téléphone *
              <input 
                required 
                type="tel"
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
              />
            </label>
            <label className="check">
              <input type="checkbox" /> Créer un compte (facultatif)
            </label>
            <hr />
            <h2>Adresse de livraison</h2>
            <label>Nom complet *
              <input 
                required 
                name="fullName" 
                value={form.fullName} 
                onChange={handleChange} 
              />
            </label>
            <label>Adresse *
              <input 
                required 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
              />
            </label>
            <div className="two">
              <label>Ville *
                <select 
                  required 
                  name="city" 
                  value={form.city} 
                  onChange={handleChange}
                  disabled={!form.governorate}
                >
                  <option value="" disabled>Sélectionner </option>
                </select>
              </label>
              <label>Gouvernorat *
                <select 
                  required 
                  name="governorate" 
                  value={form.governorate} 
                  onChange={handleGovernorateChange}
                >
                  <option value="" disabled>Sélectionner</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="two">
              <label>Code postal *
                <input 
                  required 
                  type="text"
                  name="postalCode" 
                  value={form.postalCode} 
                  onChange={handleChange} 
                />
              </label>
              <label>Pays *
                <select value="Tunisie" disabled>
                  <option>Tunisie</option>
                </select>
              </label>
            </div>
          </div>
          <div>
            <h2>Méthode de livraison</h2>
            <label className="ship active single-delivery">
              <input name="ship" type="radio" defaultChecked readOnly />
              <Truck />
              <span>
                <b>Livraison à domicile</b>
                <small>Livraison directement à votre adresse en Tunisie.</small>
              </span>
              <strong>8,00 DT</strong>
            </label>
            <div className="delivery-note"><Info size={18} /> Une seule méthode est disponible : livraison à domicile à 8 DT.</div>
            <label>Notes de commande
              <textarea 
                name="note" 
                value={form.note} 
                onChange={handleChange} 
                placeholder="Ajoutez des notes concernant votre commande..." 
              />
            </label>
          </div>
        </section>
        <aside className="summary checkout">
          <h2>Récapitulatif de la commande</h2>
          {items.map((item) => (
            <p key={item._id || item.id}>
              <span>
                <ImageWithSkeleton 
                  wrapperClassName="checkout-product-image" 
                  src={item.image || item.images?.[0]} 
                  alt="" 
                />
                {item.name}
                <small>Quantité : {item.qty}</small>
              </span>
              <b>{Number(item.price * item.qty).toFixed(2)} DT</b>
            </p>
          ))}
          <hr />
          <p>Sous-total<b>{subtotal().toFixed(2)} DT</b></p>
          <p>Livraison à domicile<b>8,00 DT</b></p>
          <h2>Total à payer <b>{total.toFixed(2)} DT</b></h2>
          <div className="cod"><Home /> Paiement à la livraison<br /><small>Vous paierez en espèces à la réception.</small></div>
          {submitError ? <p className="error-msg">{submitError}</p> : null}
          <button className="btn wide" disabled={submitting || !items.length}>
            {submitting ? 'Enregistrement...' : 'Confirmer la commande'} <ArrowRight />
          </button>
        </aside>
      </form>
      <BenefitBar />
    </>
  );
}