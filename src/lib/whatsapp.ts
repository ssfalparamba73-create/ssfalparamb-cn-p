export function toWhatsAppNumber(phone: string, defaultCountryCode = "91"): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;
  if (digits.length === 14 && digits.startsWith("0091")) return digits.slice(2);

  return digits;
}
