export function ProjectCard({ project, tagAriaSuffix, index }) {
  const cardClassName = index === 0 ? "editorial-card project-card project-card--featured" : "editorial-card project-card";

  return (
    <article className={cardClassName} data-reveal data-interactive style={{ "--reveal-delay": `${index * 70}ms` }}>
      <div className="project-card__visual" aria-hidden="true">
        <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>
        <div className="project-card__swatches">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} />
          ))}
        </div>
        <span className="project-card__corner" />
      </div>
      <div className="card-meta">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <p className="card-note">{project.note}</p>
      <div className="tag-list" aria-label={`${project.title} ${tagAriaSuffix}`}>
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
