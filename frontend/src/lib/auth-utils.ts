// Email normalization
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Role persistence utilities
export function rememberRole(role: 'employee' | 'employer') {
  sessionStorage.setItem('intendedRole', role);
  localStorage.setItem('lastChosenRole', role);
}

export function getRememberedRole(defaultRole: 'employee' | 'employer' = 'employee') {
  // Priority: URL param > localStorage > default
  const urlRole = new URLSearchParams(location.search).get('role') as 'employee' | 'employer' | null;
  if (urlRole && ['employee', 'employer'].includes(urlRole)) {
    return urlRole;
  }
  
  const storedRole = localStorage.getItem('lastChosenRole') as 'employee' | 'employer' | null;
  return storedRole || defaultRole;
}

export function clearAuthStorage() {
  sessionStorage.removeItem('intendedRole');
  sessionStorage.removeItem('verifiedEmail');
  // Keep lastChosenRole for UX
}

// Gmail domain detection
export function isGmailAddress(email: string): boolean {
  return normalizeEmail(email).endsWith('@gmail.com');
}
