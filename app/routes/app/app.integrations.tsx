import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { requireAdminSession } from "../../lib/auth-guards.server";
import { INTEGRATION_CATEGORIES } from "../../lib/recovered-admin-surfaces";
import styles from "../../styles/routes/recovered-admin-surfaces.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdminSession(request);
  return json(null);
}

export default function IntegrationsRoute() {
  const [openIntegrationId, setOpenIntegrationId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <>
      <ui-title-bar title="Integrations" />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <h1 className={styles.title}>Integrations Hub</h1>
            <p className={styles.subtitle}>
              Browse supported integrations to extend your bundle capabilities.
            </p>
          </div>
          <button
            type="button"
            className={styles.integrationButton}
            onClick={() => setRequestOpen((current) => !current)}
          >
            Request Integration
          </button>
        </header>

        {INTEGRATION_CATEGORIES.map((category) => (
          <section key={category.id} className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <p className={styles.categoryDescription}>{category.description}</p>
            </div>
            <div className={styles.integrationGrid}>
              {category.cards.map((integration) => {
                const isOpen = openIntegrationId === integration.id;
                return (
                  <article key={integration.id} className={styles.integrationCard}>
                    <div className={styles.integrationTop}>
                      {integration.logoUrl ? (
                        <img className={styles.logoImage} src={integration.logoUrl} alt={`${integration.title} logo`} />
                      ) : (
                        <span className={styles.logo}>
                          {integration.logoLabel}
                        </span>
                      )}
                      <div>
                        <h3 className={styles.integrationName}>{integration.title}</h3>
                        <p className={styles.integrationDescription}>{integration.description}</p>
                        <button
                          type="button"
                          className={styles.integrationButton}
                          onClick={() => setOpenIntegrationId(isOpen ? null : integration.id)}
                        >
                          {integration.ctaLabel}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className={styles.guideBox}>
                        <h4 className={styles.guideHeading}>
                          {integration.ctaType === "chat" ? "Chat setup" : "Setup guide"}
                        </h4>
                        <ul>
                          {integration.guideSummary.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {requestOpen && (
          <section className={styles.requestCard}>
            <div>
              <h2 className={styles.cardTitle}>Request Integration</h2>
              <p>
                Send the integration name, required bundle flow, and storefront behavior to the support team. Do not include private tokens or credentials.
              </p>
              <p>
                This mirrors the recovered request-intent flow: collect the merchant request first, then continue setup through support instead of opening a static guide.
              </p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
