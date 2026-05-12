export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex < 0) return '*'.repeat(email.length);
  const local = '*'.repeat(atIndex);
  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf('.');
  const tld = dotIndex >= 0 ? domain.slice(dotIndex) : '';
  const maskedDomain = '*'.repeat(dotIndex >= 0 ? dotIndex : domain.length);
  return `${local}@${maskedDomain}${tld}`;
}

export function maskPhone(phone: string): string {
  const match = phone.match(/^(\+\d{1,3})(.*)/);
  if (!match) return '*'.repeat(phone.length);
  const [, countryCode, rest] = match;
  return `${countryCode}${'*'.repeat(rest.length)}`;
}
