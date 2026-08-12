export function WritingCard({ entry, index }) {
  const isExternal = entry.href.startsWith("http");
  const cardClassName = index === 0 ? "editorial-card writing-card writing-card--featured" : "editorial-card writing-card";

  return (
    <article className={cardClassName} data-reveal data-interactive style={{ "--reveal-delay": `${index * 80}ms` }}>
      <div className="writing-card__visual" aria-hidden="true">
        <span className="writing-card__index">{String(index + 1).padStart(2, "0")}</span>
        <span className="writing-card__line" />
        <span className="writing-card__corner" />
      </div>
      <p className="card-type">{entry.type}</p>
      <h3>{entry.title}</h3>
      <p>{entry.excerpt}</p>
      <a
        className="inline-link"
        href={entry.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
      >
        {entry.linkLabel}
      </a>
    </article>
  );
}
