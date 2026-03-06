export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatDate(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function parseDateToISO(dateStr: string): string {
  const d = dateStr.replace(/\D/g, "");
  if (d.length !== 8) return "";
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)} 00:00:00`;
}

export function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "") || "0";
  const padded = digits.padStart(3, "0");
  return `${padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${padded.slice(-2)}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function formatDatePT(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
