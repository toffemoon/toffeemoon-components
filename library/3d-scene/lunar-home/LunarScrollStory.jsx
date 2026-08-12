import { forwardRef } from "react";
import { useI18n } from "../i18n.jsx";

const beatOrder = ["who", "how", "values"];

export function LunarScrollStory({
  activeBeat,
  reducedMotion = false,
  staticScene = false,
}) {
  const { t } = useI18n();
  const content = t("home.lunar.scroll");
  const pinnedStory = !reducedMotion && !staticScene;
  const accessibleIntroduction = beatOrder
    .flatMap((key) => [content.beats[key].title, content.beats[key].body])
    .join(" ");

  return (
    <section className="lunar-scroll-copy">
      <div className="lunar-scroll-copy__beats">
        {beatOrder.map((key) => {
          const beat = content.beats[key];
          return (
            <article
              className="lunar-scroll-copy__beat"
              data-lunar-beat={key}
              aria-hidden={pinnedStory ? key !== activeBeat : undefined}
              key={key}
            >
              <p className="lunar-scroll-copy__kicker">{beat.kicker}</p>
              <h2>{beat.title}</h2>
              <p>{beat.body}</p>
            </article>
          );
        })}
      </div>

      {pinnedStory && (
        <p className="lunar-scroll-copy__accessible sr-only">
          {accessibleIntroduction}
        </p>
      )}

      <ol className="lunar-scroll-copy__capability-list">
        {content.capabilities.map((capability) => (
          <li key={capability}>
            <h2>{capability}</h2>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const LunarEvidenceField = forwardRef(function LunarEvidenceField(
  { evidenceItems = [] },
  ref,
) {
  const { pick, t } = useI18n();
  const content = t("home.lunar.scroll");

  return (
    <section
      ref={ref}
      className="lunar-evidence"
      aria-labelledby="lunar-evidence-heading"
    >
      <h2 id="lunar-evidence-heading">{content.evidenceLabel}</h2>

      <div className="lunar-evidence__rows">
        {evidenceItems.map((item) => (
          <a
            className="lunar-evidence__row"
            href={`/work#${item.id}`}
            key={item.id}
          >
            <h3>{item.title}</h3>
            <span>{pick(item.lunarEvidenceLabel)}</span>
            <ul>
              {item.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </a>
        ))}
      </div>

      <div className="lunar-evidence__actions">
        <a href="/about">{content.actions.about}</a>
        <a href="/work">{content.actions.work}</a>
      </div>
    </section>
  );
});
