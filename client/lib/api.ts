import type { ApiResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lms_token');
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lms_token');
  document.cookie = 'lms_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function buildAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildFormAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseBody<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(`Server returned an invalid response (${response.status})`, response.status);
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 401) {
    clearStoredToken();

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const body = await parseBody<T>(response);

  if (response.status === 422) {
    throw new ApiError(body.message ?? 'Validation failed', 422, body.data);
  }

  if (!response.ok) {
    throw new ApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.data
    );
  }

  return body;
}

export async function get<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  return handleResponse<T>(response);
}

export async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}

export async function patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}

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

export async function put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}

export async function del<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });

  return handleResponse<T>(response);
}
