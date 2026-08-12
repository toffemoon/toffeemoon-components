export function MarqueeBand({ items, tone = "default" }) {
  const repeatedItems = [...items, ...items];

  return (
    <div className={`marquee-band marquee-band--${tone}`} aria-hidden="true">
      <div className="marquee-band__track">
        {repeatedItems.map((item, index) => (
          <span key={`${tone}-${index}-${item}`} className="marquee-band__item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
