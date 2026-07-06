export function openThemeEditorInNewTab(themeEditorUrl: string): void {
  if (!themeEditorUrl) return;
  window.open(themeEditorUrl, "_blank", "noopener,noreferrer");
}
