export default function SectionHeader({ id, title, lead, align = 'start' }) {
  return (
    <header className={`section-header section-header--${align}`}>
      <h2 id={id}>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}
