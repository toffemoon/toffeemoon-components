export function ChapterGuide({ sections, activeSection, language }) {
  const activeIndex = sections.findIndex((section) => section.id === activeSection);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const nextSection = sections[safeIndex + 1] ?? null;

  return (
    <aside
      className="chapter-guide"
      aria-label={language === "en" ? "Section guide" : "页面导览"}
      style={{ "--active-index": safeIndex }}
    >
      <p className="chapter-guide__eyebrow">{language === "en" ? "Guide" : "导览"}</p>

      <div className="chapter-guide__body">
        <span className="chapter-guide__line" aria-hidden="true" />
        <span className="chapter-guide__marker" aria-hidden="true" />

        <nav className="chapter-guide__nav">
          {sections.map((section, index) => (
            <a
              key={section.id}
              className={section.id === activeSection ? "is-active" : ""}
              href={`#${section.id}`}
            >
              <span className="chapter-guide__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="chapter-guide__label">{section.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="chapter-guide__footer">
        <p className="chapter-guide__footer-label">{language === "en" ? "Next" : "下一页"}</p>
        {nextSection ? (
          <a className="chapter-guide__next" href={`#${nextSection.id}`}>
            {nextSection.label}
          </a>
        ) : (
          <span className="chapter-guide__next chapter-guide__next--muted">
            {language === "en" ? "End" : "结束"}
          </span>
        )}
      </div>
    </aside>
  );
}
