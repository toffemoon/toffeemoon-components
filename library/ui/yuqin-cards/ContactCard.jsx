export function ContactCard({ item }) {
  const isExternal = item.href.startsWith("http");

  return (
    <article className="editorial-card contact-card" data-reveal data-interactive>
      <p className="card-type">{item.label}</p>
      <a
        className="contact-card__value"
        href={item.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        download={item.download ? true : undefined}
      >
        {item.value}
      </a>
      <p>{item.description}</p>
    </article>
  );
}
