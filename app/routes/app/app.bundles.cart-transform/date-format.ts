const CART_TRANSFORM_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCartTransformDate(value: Date | string | null | undefined): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return CART_TRANSFORM_DATE_FORMATTER.format(date);
}
