export function formatTimestamp(value: number | null, locale: string): string {
  return value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)) : "-";
}
