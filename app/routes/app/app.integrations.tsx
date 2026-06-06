import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { INTEGRATION_CATEGORIES } from "../../lib/admin-configuration-surfaces";
import styles from "../../styles/routes/admin-configuration-surfaces.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdminSession(request);
  return json(null);
}

export default function IntegrationsRoute() {
  return (
    <>
      <ui-title-bar title="Integrations" />
      <main className={`${styles.page} ${styles.integrationsPage}`}>
        <header className={styles.integrationsHeader}>
          <div>
            <h1 className={styles.title}>Integrations Hub</h1>
            <p className={styles.subtitle}>
              Browse supported integrations to extend your bundle capabilities.
            </p>
          </div>
          <a
            className={styles.integrationRequestButton}
            href="https://wolfpackapps.com"
            target="_blank"
            rel="noreferrer"
          >
            <span>Request Integration</span>
            <span className={styles.integrationRequestIcon} aria-hidden="true">⌘</span>
          </a>
        </header>

        {INTEGRATION_CATEGORIES.map((category) => (
          <section key={category.id} className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <p className={styles.categoryDescription}>{category.description}</p>
            </div>
            <div className={styles.integrationGrid}>
              {category.cards.map((integration) => (
                <article key={integration.id} className={styles.integrationTile}>
                  {integration.logoUrl ? (
                    <img className={styles.logoImage} src={integration.logoUrl} alt={`${integration.title} logo`} />
                  ) : (
                    <span className={styles.logo}>
                      {integration.logoLabel}
                    </span>
                  )}
                  <div className={styles.integrationContent}>
                    <h3 className={styles.integrationName}>{integration.title}</h3>
                    <p className={styles.integrationDescription}>{integration.description}</p>
                    <a
                      className={styles.integrationButton}
                      href={integration.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>{integration.ctaLabel}</span>
                      <span className={styles.integrationCtaArrow} aria-hidden="true">→</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
