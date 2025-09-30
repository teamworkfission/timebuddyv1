const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function apiPost<T>(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = 10000, retries = 0 } = options;
  
  const makeRequest = async (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 429 (Too Many Requests) with user-friendly message
        if (response.status === 429) {
          throw new Error('Too many attempts, please try again later');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  };

  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await makeRequest();
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Don't retry on auth errors or rate limiting
      if (lastError.message.includes('Unauthorized') || 
          lastError.message.includes('Too many attempts')) {
        throw lastError;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError!;
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
  console.log('🌐 Frontend: Making auth completion API call', {
    hasToken: !!token,
    tokenLength: token?.length,
    intendedRole,
    apiUrl: `${API_BASE_URL}/auth/complete`
  });
  
  return apiPost<CompleteAuthResponse>(
    '/auth/complete',
    { intendedRole },
    { Authorization: `Bearer ${token}` },
    { 
      timeout: 15000, // 15 seconds timeout for mobile networks
      retries: 2      // Retry twice on network failures
    }
  );
}
