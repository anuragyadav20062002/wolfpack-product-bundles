import { FEATURE_COMPARISON, type FeatureComparisonRow } from "../../constants/pricing-data";
import styles from "./FeatureComparisonTable.module.css";

function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return (
      <div style={{ color: "#008060", display: "flex", justifyContent: "center" }}>
        <s-icon type="check" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div style={{ color: "#8c9196", display: "flex", justifyContent: "center" }}>
        <s-icon type="x" />
      </div>
    );
  }
  return <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>;
}

export interface FeatureComparisonTableProps {
  features?: FeatureComparisonRow[];
}

export function FeatureComparisonTable({
  features = FEATURE_COMPARISON,
}: FeatureComparisonTableProps) {
  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Feature Comparison</h3>
        <div className={styles.scrollRegion} role="region" aria-label="Plan feature comparison" tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e1e3e5" }}>
                <th className={styles.featureHeading}>
                  Feature
                </th>
                <th className={styles.planHeading}>
                  Free
                </th>
                <th className={`${styles.planHeading} ${styles.growColumn}`}>
                  Grow
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((row, index) => (
                <tr
                  key={index}
                  style={{ borderBottom: "1px solid #e1e3e5", backgroundColor: row.highlight ? "#fafbfb" : "transparent" }}
                >
                  <td className={styles.featureCell} data-highlight={row.highlight || undefined}>
                    {row.feature}
                  </td>
                  <td className={styles.planCell}>
                    {renderFeatureValue(row.free)}
                  </td>
                  <td className={`${styles.planCell} ${styles.growColumn}`}>
                    {renderFeatureValue(row.grow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </s-stack>
    </s-section>
  );
}
