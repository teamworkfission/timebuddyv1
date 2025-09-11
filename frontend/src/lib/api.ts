const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL environment variable');
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Handle 429 (Too Many Requests) with user-friendly message
    if (response.status === 429) {
      throw new Error('Too many attempts, please try again later');
    }
    
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Auth API functions
export interface CheckEmailResponse {
  ok: boolean;
  message: string;
  next: 'signup' | 'signin';
}

export interface CompleteAuthResponse {
  id: string;
  email: string;
  role: 'employee' | 'employer';
}

export function checkEmail(email: string, context: 'signup' | 'signin') {
  return apiPost<CheckEmailResponse>('/auth/check-email', { email, context });
}

export function completeAuth(token: string, intendedRole?: 'employee' | 'employer') {
  return apiPost<CompleteAuthResponse>(
    '/auth/complete',
    { intendedRole },
    { Authorization: `Bearer ${token}` }
  );
}
