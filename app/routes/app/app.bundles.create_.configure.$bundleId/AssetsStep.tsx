import { FilePicker } from "../../../components/shared/FilePicker";
import styles from "./wizard-configure.module.css";

type Props = { ctx: any };

export function AssetsStep({ ctx }: Props) {
  const { promoBannerBgImage, setPromoBannerBgImage, loadingGif, setLoadingGif, setFiltersDrawerOpen, searchBarEnabled, setSearchBarEnabled, setCustomFieldsModalOpen, handleBack, handleNext, isAnyWizardSaveInFlight } = ctx;
  return (
  <div className={styles.assetsLayout}>
    {/* Media Assets */}
    <div className={styles.card}>
      <div style={{ marginBottom: 20 }}>
        <s-heading>Media Assets</s-heading>
        <s-text color="subdued">
          Add visual media to your bundle configurator to enhance the customer experience on your storefront.
        </s-text>
      </div>
      <div className={styles.assetsGrid}>
        <div className={styles.assetBlock}>
          <s-heading>Promo Banner</s-heading>
          <FilePicker
            value={promoBannerBgImage}
            onChange={setPromoBannerBgImage}
            label="Choose background image"
            hint="Recommended: 1920×400px"
            uploadLabel="Upload image"
          />
          <div className={styles.formatChip}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Format: JPG, PNG, WebP
          </div>
        </div>
        <div className={styles.assetBlock}>
          <s-heading>Loading Animation</s-heading>
          <FilePicker
            value={loadingGif}
            onChange={setLoadingGif}
            label="Choose loading GIF"
            hint="Recommended: 150×150px"
            uploadLabel="Upload"
          />
          <div className={styles.formatChip}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Format: GIF only
          </div>
        </div>
      </div>
    </div>

    {/* Filters + Search Bar + Custom Fields — single card */}
    <div className={styles.card}>
      {/* Filters */}
      <div
        className={styles.assetRow}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onClick={() => setFiltersDrawerOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setFiltersDrawerOpen(true)}
      >
        <div className={styles.assetRowLeft}>
          <s-icon type="filter" />
          <div>
            <p className={styles.assetRowTitle}>Filters</p>
            <p className={styles.assetRowSubtitle}>
              Create filters to display on this step
            </p>
          </div>
        </div>
        <s-button
          variant="tertiary"
          icon="arrow-right"
          accessibilityLabel="Configure filters"
        />
      </div>

      <div className={styles.displayOptionDivider} />

      {/* Search Bar */}
      <div className={styles.assetRow}>
        <div className={styles.assetRowLeft}>
          <s-icon type="search" />
          <div>
            <p className={styles.assetRowTitle}>Search Bar</p>
            <p className={styles.assetRowSubtitle}>
              Show a product search bar inside the bundle widget
            </p>
          </div>
        </div>
        <s-switch
          accessibilityLabel="Show search bar"
          checked={searchBarEnabled || undefined}
          onChange={(e) =>
            setSearchBarEnabled((e.target as HTMLInputElement).checked)
          }
        />
      </div>

      <div className={styles.displayOptionDivider} />

      {/* Custom Fields */}
      <div
        className={styles.assetRow}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onClick={() => setCustomFieldsModalOpen(true)}
        onKeyDown={(e) =>
          e.key === "Enter" && setCustomFieldsModalOpen(true)
        }
      >
        <div className={styles.assetRowLeft}>
          <s-icon type="edit" />
          <div>
            <p className={styles.assetRowTitle}>Custom Fields</p>
            <p className={styles.assetRowSubtitle}>
              Add custom input fields (like gift notes or delivery dates) that will be attached to the order line items.
            </p>
          </div>
        </div>
        <s-button
          variant="tertiary"
          icon="arrow-right"
          accessibilityLabel="Configure custom fields"
        />
      </div>
    </div>

    {/* Footer */}
    <div className={styles.wizardFooter}>
      <s-button variant="secondary" onClick={handleBack}>
        Back
      </s-button>
      <s-button
        variant="primary"
        disabled={isAnyWizardSaveInFlight || undefined}
        onClick={handleNext}
      >
        Next
      </s-button>
    </div>
  </div>
  );
}
