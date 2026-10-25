import Icon from '../../components/ui/Icon.jsx';

// Honest placeholder: no fake data. Replaced by the real module in its phase.
export default function ComingSoonPage({ item }) {
  return (
    <section className="page__section">
      <h1 className="page__title">{item.label}</h1>
      <div className="card empty">
        <Icon name={item.icon} size={32} />
        <p><strong>{item.blurb}</strong></p>
        <p className="muted">This module is built in Phase {item.phase} of the roadmap.</p>
      </div>
    </section>
  );
}
