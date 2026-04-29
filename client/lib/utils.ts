/**
 * Format a number as Indian Rupee currency string.
 * e.g. 100000 → "₹1,00,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an ISO date string to "12 Jan 2025".
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculate age in years from a date-of-birth string.
 */
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

/**
 * Simple Interest = (P × 12 × T) / (365 × 100)
 * where P = principal, T = tenure in days
 */
export function calculateSI(principal: number, tenure: number): number {
  return (principal * 12 * tenure) / (365 * 100);
}

/**
 * Total Repayment = Principal + Simple Interest
 */
export function calculateTotalRepayment(principal: number, tenure: number): number {
  return principal + calculateSI(principal, tenure);
}

/**
 * Truncate a string to maxLen characters, appending "…" if cut.
 */
export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

/**
 * Decode the payload section of a JWT (base64url → JSON).
 * Returns null if decoding fails.
 */
export function decodeJWTPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Return initials from a full name (up to 2 letters).
 * e.g. "Rajesh Kumar" → "RK"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/**
 * Convert bytes to a human-readable file size string.
 * e.g. 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}