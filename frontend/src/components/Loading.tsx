export default function Loading({ label = 'Loading...', type = 'products', count = 8 }) {
  if (type === 'detail') return <div className="skeleton-detail" aria-label={label}><div className="skeleton skeleton-gallery"/><div className="skeleton-detail-copy"><div className="skeleton sk-line lg"/><div className="skeleton sk-line md"/><div className="skeleton sk-line"/><div className="skeleton sk-line"/><div className="skeleton sk-button"/></div></div>;
  return <div className="skeleton-grid product-skeleton-grid" aria-label={label} aria-busy="true">{Array.from({length:count}).map((_, i) => <article className="product-card product-skeleton-card" key={i}>
    <span className="skeleton product-skeleton-badge" />
    <span className="skeleton product-skeleton-wish" />
    <div className="skeleton product-skeleton-media" />
    <div className="product-skeleton-info">
      <span className="skeleton product-skeleton-category" />
      <span className="skeleton product-skeleton-title" />
      <span className="skeleton product-skeleton-title short" />
      <span className="skeleton product-skeleton-rating" />
      <span className="skeleton product-skeleton-price" />
      <span className="skeleton product-skeleton-stock" />
    </div>
    <span className="skeleton product-skeleton-cart" />
  </article>)}</div>;
}
