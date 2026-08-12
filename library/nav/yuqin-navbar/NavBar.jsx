export function NavBar({
  brand,
  subtitle,
  sections,
  activeSection,
  ariaLabel,
  languageLabel,
  scrollProgress,
  onToggleLanguage,
}) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand-mark" href="#home">
          <span className="brand-mark__title">{brand}</span>
          <span className="brand-mark__subtitle">{subtitle}</span>
        </a>

        <div className="site-header__actions">
          <nav className="site-nav" aria-label={ariaLabel}>
            {sections.map((section) => (
              <a
                key={section.id}
                className={activeSection === section.id ? "is-active" : ""}
                href={`#${section.id}`}
              >
                {section.label}
              </a>
            ))}
          </nav>

          <button className="lang-toggle" type="button" onClick={onToggleLanguage}>
            {languageLabel}
          </button>
        </div>
      </div>
      <span
        className="site-header__progress"
        aria-hidden="true"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />
    </header>
  );
}
