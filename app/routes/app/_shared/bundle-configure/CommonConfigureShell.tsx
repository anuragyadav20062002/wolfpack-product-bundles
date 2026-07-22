import type { ReactNode } from "react";

interface CommonConfigureShellProps {
  blockConfigurationChangeWhileSaving: (event: any) => void;
  isSaveInFlight: boolean;
  styles: Record<string, string>;
  saveForm: ReactNode;
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  overlays: ReactNode;
}

export function CommonConfigureShell({
  blockConfigurationChangeWhileSaving,
  isSaveInFlight,
  styles,
  saveForm,
  header,
  sidebar,
  children,
  overlays,
}: CommonConfigureShellProps) {
  return (
    <div className={styles.configureQueryContainer}>
      <s-query-container containerName="bundle-configure">
        <div
          className={styles.editCanvas}
          data-admin-save-lock-active={isSaveInFlight || undefined}
          onBeforeInputCapture={blockConfigurationChangeWhileSaving}
          onChangeCapture={blockConfigurationChangeWhileSaving}
          onClickCapture={blockConfigurationChangeWhileSaving}
          onDropCapture={blockConfigurationChangeWhileSaving}
          onInputCapture={blockConfigurationChangeWhileSaving}
          onKeyDownCapture={blockConfigurationChangeWhileSaving}
          onPasteCapture={blockConfigurationChangeWhileSaving}
          onPointerDownCapture={blockConfigurationChangeWhileSaving}
        >
          {saveForm}
          {header}
          {overlays}
          <div className={styles.editGrid}>
            {sidebar}
            <div className={styles.mainColumn}>{children}</div>
          </div>
        </div>
      </s-query-container>
    </div>
  );
}
