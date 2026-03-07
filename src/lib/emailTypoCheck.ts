const DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gemail.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaahoo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "oulook.com": "outlook.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
};

export function checkEmailTypo(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[1]) return null;
  const corrected = DOMAIN_TYPOS[parts[1].toLowerCase()];
  if (corrected) return `${parts[0]}@${corrected}`;
  return null;
}
