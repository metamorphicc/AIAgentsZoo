export function formatDate(value: string | null): string {
  if (!value) return "Never awakened";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Novosibirsk",
  }).format(new Date(value));
}

export function formatStatus(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export function formatEventType(value: string): string {
  return value.replaceAll("_", " ");
}
