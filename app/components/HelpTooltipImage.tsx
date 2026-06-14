import sharedStyles from "../styles/routes/bundle-configure-shared.module.css";

export function HelpTooltipImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={sharedStyles.richHelpImage}
      loading="lazy"
      decoding="async"
    />
  );
}
