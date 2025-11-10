// src/shared/utils/phone.js
export function sanitizePhone(raw) {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 9);
}
export function isValidCl9(digits) {
  return String(digits ?? "").replace(/\D/g, "").length === 9;
}
