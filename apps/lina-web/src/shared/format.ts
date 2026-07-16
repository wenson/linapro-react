export function formatTimestamp(value: number | null | undefined, locale: string): string {
  if (!value || !Number.isFinite(value)) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}
