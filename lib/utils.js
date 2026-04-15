export function formatCurrency(amount) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatAccountId(id) {
  if (!id) return "";
  return id.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
}

export function maskAccountId(id) {
  if (!id) return "";
  return "***-****-" + id.slice(-4);
}

export function generateAccountId() {
  const digits = [];
  for (let i = 0; i < 11; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join("");
}

export function getNextAccountNumber(lastNumber) {
  const start = 2532;
  if (!lastNumber) return String(start).padStart(7, "0");
  const num = parseInt(lastNumber, 10) + 1;
  return String(num).padStart(7, "0");
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
