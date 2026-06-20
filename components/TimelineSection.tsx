import type { Section, TimelineEntry } from "@/lib/types";
import { ArrowUpRight } from "@/components/icons";

function Title({ entry }: { entry: TimelineEntry }) {
  if (entry.href) {
    return (
      <a
        href={entry.href}
        target="_blank"
        rel="noopener noreferrer"
        className="timeline-title timeline-title-link"
      >
        {entry.title}
        <ArrowUpRight size={14} />
      </a>
    );
  }
  return <h3 className="timeline-title">{entry.title}</h3>;
}

export default function TimelineSection({ section }: { section: Section }) {
  // multi-entry sections (Projects) divide every row; single "headline"
  // sections (Work, Education, Awards) drop the top rule
  const ruled = section.entries.length > 1;

  return (
    <section
      id={section.id}
      className="section"
      data-screen-label={section.label}
      data-reveal
    >
      <div className="section-label">
        <span className="section-label-index">{section.index}</span>
        <span className="section-label-text">{section.label}</span>
        <span className="section-label-line" />
      </div>

      {section.entries.map((entry, i) => (
        <div
          key={`${section.id}-${i}`}
          className={ruled ? "timeline-row" : "timeline-row no-rule"}
        >
          <div className="timeline-period">{entry.period}</div>
          <div>
            <Title entry={entry} />
            <div className="timeline-subtitle">
              {entry.active ? (
                <span className="timeline-subtitle-dot" />
              ) : null}
              {entry.subtitle}
            </div>

            {entry.description ? (
              <p className="timeline-desc">{entry.description}</p>
            ) : null}

            {entry.bullets ? (
              <div className="bullet-list">
                {entry.bullets.map((b, j) => (
                  <div className="bullet" key={j}>
                    <span className="bullet-lead">{b.lead}</span> — {b.text}
                  </div>
                ))}
              </div>
            ) : null}

            {entry.tags && entry.tags.length ? (
              <div className="tag-row">
                {entry.tags.map((tag, k) => (
                  <span
                    key={k}
                    className={tag.highlight ? "tag highlight" : "tag"}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
