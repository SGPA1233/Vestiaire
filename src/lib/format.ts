import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelativeDate(date: Date): string {
  if (isToday(date)) return "aujourd'hui";
  if (isYesterday(date)) return "hier";
  return format(date, "dd/MM/yyyy", { locale: fr });
}

export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: Date): string {
  return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
}
