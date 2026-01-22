import { ReactNode } from "react";

interface ModalLayoutProps {
  navigation: ReactNode;
  preview: ReactNode;
  settings: ReactNode;
}

/**
 * ModalLayout - Three-column layout for the Design Control Panel modal.
 * Structure:
 * - Left sidebar (220px): Navigation menu
 * - Center (flex): Visual preview area
 * - Right panel (240px): Settings controls
 */
export function ModalLayout({ navigation, preview, settings }: ModalLayoutProps) {
  return (
    <div style={{ display: "flex", height: "100vh", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Left Sidebar - Navigation */}
      <div
        style={{
          width: "220px",
          minWidth: "220px",
          borderRight: "1px solid #D9D9D9",
          backgroundColor: "#FFFFFF",
          overflowY: "auto",
        }}
      >
        {navigation}
      </div>

      {/* Right Side - Visual Preview + Settings */}
      <div style={{ flex: 1, display: "flex", overflowY: "auto", minWidth: 0 }}>
        {/* Center - Visual Preview */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            backgroundColor: "#F4F4F4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          {/* Preview with Arrow Overlay */}
          <div style={{ position: "relative", display: "inline-block" }}>
            {preview}
          </div>
        </div>

        {/* Right Panel - Settings Controls */}
        <div
          style={{
            width: "240px",
            minWidth: "240px",
            borderLeft: "1px solid #D9D9D9",
            padding: "20px",
            backgroundColor: "#FFFFFF",
            overflowY: "auto",
          }}
        >
          {settings}
        </div>
      </div>
    </div>
  );
}
