import type { ApiResponse } from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// ─── Token Helpers ────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lms_token');
}

function buildAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function buildFormAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  // Do NOT set Content-Type for multipart — browser sets it with the boundary
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Response Handler ─────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  // 401 → force logout
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_token');
      document.cookie =
        'lms_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  let body: ApiResponse<T>;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Server returned an invalid response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(body.message ?? `Request failed with status ${response.status}`);
  }

  return body;
}

// ─── HTTP Methods ─────────────────────────────────────────────────────────────

/**
 * HTTP GET — fetch data from a resource.
 */
export async function get<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });
  return handleResponse<T>(response);
}

/**
 * HTTP POST — send JSON body to create a resource.
 */
export async function post<T>(
  path: string,
  body: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/**
 * HTTP PATCH — send JSON body to partially update a resource.
 */
export async function patch<T>(
  path: string,
  body: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/**
 * HTTP POST with FormData — used for file uploads.
 * Does NOT set Content-Type so the browser can attach the multipart boundary.
 */
export async function postForm<T>(
  path: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildFormAuthHeaders(),
    body: formData,
  });
  return handleResponse<T>(response);
}

/**
 * HTTP PUT — send JSON body to replace a resource (included for completeness).
 */
export async function put<T>(
  path: string,
  body: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

/**
 * HTTP DELETE — remove a resource.
 */
export async function del<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });
  return handleResponse<T>(response);
}