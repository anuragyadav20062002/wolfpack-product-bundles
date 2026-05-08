import styles from "./wizard-configure.module.css";

interface StepSummaryProps {
  selectedCount: number;
  rulesCount: number;
  filtersCount: number;
  searchBarEnabled: boolean;
  customFieldsCount: number;
  onPreview: () => void;
}

export function StepSummary({
  selectedCount,
  rulesCount,
  filtersCount,
  searchBarEnabled,
  customFieldsCount,
  onPreview,
}: StepSummaryProps) {
  return (
    <div className={styles.sideCard}>
      <s-stack direction="block" gap="small">
        <s-heading>Step Summary</s-heading>
        <s-text color="subdued">
          Select product here will be displayed on this step
        </s-text>
        <div className={styles.summaryList}>
          <div className={styles.summaryItem}>
            <s-icon type="product" />
            <span className={styles.summaryLabel}>Selected products</span>
            <span
              className={
                selectedCount > 0
                  ? styles.summaryValueActive
                  : styles.summaryValue
              }
            >
              {selectedCount > 0 ? selectedCount : "—"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <s-icon type="note" />
            <span className={styles.summaryLabel}>Rules</span>
            <span
              className={
                rulesCount > 0
                  ? styles.summaryValueActive
                  : styles.summaryValue
              }
            >
              {rulesCount > 0 ? rulesCount : "None"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <s-icon type="filter" />
            <span className={styles.summaryLabel}>Filters</span>
            <span
              className={
                filtersCount > 0
                  ? styles.summaryValueActive
                  : styles.summaryValue
              }
            >
              {filtersCount > 0 ? filtersCount : "None"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <s-icon type="search" />
            <span className={styles.summaryLabel}>Search Bar</span>
            <span
              className={
                searchBarEnabled
                  ? styles.summaryValueActive
                  : styles.summaryValue
              }
            >
              {searchBarEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <s-icon type="edit" />
            <span className={styles.summaryLabel}>Custom Fields</span>
            <span
              className={
                customFieldsCount > 0
                  ? styles.summaryValueActive
                  : styles.summaryValue
              }
            >
              {customFieldsCount > 0 ? customFieldsCount : "None"}
            </span>
          </div>
        </div>
        <div className={styles.previewButtonWrap}>
          <s-button variant="primary" icon="view" onClick={onPreview}>
            Preview
          </s-button>
        </div>
      </s-stack>
    </div>
  );
}
