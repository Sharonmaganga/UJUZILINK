/** Normalises a Kenyan phone number to 2547XXXXXXXX / 2541XXXXXXXX, or returns null if invalid. */
export function normaliseKenyanPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  let n = digits;
  if (n.startsWith("0")) n = "254" + n.slice(1);
  else if (n.length === 9 && (n.startsWith("7") || n.startsWith("1"))) n = "254" + n;
  return /^254[17]\d{8}$/.test(n) ? n : null;
}
