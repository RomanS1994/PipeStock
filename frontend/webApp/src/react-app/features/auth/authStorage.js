const STORAGE_KEY = 'pipestock_auth';

export function readStoredAuth() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { token: value.token || '', user: value.user || null };
  } catch {
    return { token: '', user: null };
  }
}

export function saveStoredAuth(token, user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
