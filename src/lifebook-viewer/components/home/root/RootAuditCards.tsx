import type { RootAuditCardMock } from "./rootBlueprintMock";
import styles from "./RootAuditCards.module.css";

export interface RootAuditCardsProps {
  cards: RootAuditCardMock[];
}

function variantClass(v: RootAuditCardMock["variant"]) {
  if (v === "drive") return styles.drive;
  if (v === "tension") return styles.tension;
  return styles.ultimate;
}

export function RootAuditCards({ cards }: RootAuditCardsProps) {
  return (
    <section className={styles.section} aria-label="系統讀取報告">
      {cards.map((c) => (
        <article key={c.title} className={`${styles.card} ${variantClass(c.variant)}`}>
          <div className={styles.header}>
            <h2 className={styles.title}>{c.title}</h2>
            <span className={styles.tag}>{c.tag}</span>
          </div>
          <p className={styles.body}>{c.body}</p>
          <div className={styles.insight}>{c.insight}</div>
        </article>
      ))}
    </section>
  );
}
