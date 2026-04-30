export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

export function calculateSI(principal: number, tenure: number): number {
  return (principal * 12 * tenure) / (365 * 100);
}

export function calculateTotalRepayment(principal: number, tenure: number): number {
  return principal + calculateSI(principal, tenure);
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}...`;
}

export function decodeJWT<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');

    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}

export function decodeJWTPayload<T = Record<string, unknown>>(token: string): T | null {
  return decodeJWT<T>(token);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
