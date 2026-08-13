export default function Loading({ label = 'Loading...', type = 'products', count = 8 }) {
  if (type === 'detail') return <div className="skeleton-detail" aria-label={label}><div className="skeleton skeleton-gallery"/><div className="skeleton-detail-copy"><div className="skeleton sk-line lg"/><div className="skeleton sk-line md"/><div className="skeleton sk-line"/><div className="skeleton sk-line"/><div className="skeleton sk-button"/></div></div>;
  return <div className="skeleton-grid" aria-label={label}>{Array.from({length:count}).map((_,i)=><article className="skeleton-card" key={i}><div className="skeleton sk-image"/><div className="skeleton sk-line md"/><div className="skeleton sk-line"/><div className="skeleton sk-line sm"/></article>)}</div>;
}
