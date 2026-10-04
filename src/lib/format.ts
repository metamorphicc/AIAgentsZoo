export function formatDate(value: string | null): string {
  if (!value) return "ещё не просыпался";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Novosibirsk",
  }).format(new Date(value));
}
