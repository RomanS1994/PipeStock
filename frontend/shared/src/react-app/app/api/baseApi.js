import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const AUTH_STORAGE_KEY = 'pipestock_auth';

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (configuredBaseUrl) return configuredBaseUrl;
  if (import.meta.env.DEV) return 'http://localhost:3001/api';
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath.replace(/\/$/, '')}/api`;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: resolveBaseUrl(),
  credentials: 'include',
  prepareHeaders(headers, { getState }) {
    const token = getState()?.auth?.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshRequest = null;

function isAuthRequest(args) {
  const url = typeof args === 'string' ? args : args?.url;
  return String(url || '').startsWith('/auth/');
}

function authScope(user) {
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && item.company);
  return [user?.id || '', membership?.id || '', membership?.role || '', membership?.company?.id || ''].join(':');
}

function readConcurrentTabSession(previousToken) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');
    if (!stored.token || !stored.user || stored.token === previousToken) return null;
    return { token: stored.token, user: stored.user };
  } catch {
    return null;
  }
}

function clearAuthAndApiCache(api) {
  api.dispatch({ type: 'auth/clearSession' });
  api.dispatch(baseApi.util.resetApiState());
}

async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isAuthRequest(args)) return result;

  const authBeforeRefresh = api.getState()?.auth || {};
  const tokenBeforeRefresh = authBeforeRefresh.token || '';
  const scopeBeforeRefresh = authScope(authBeforeRefresh.user);

  if (!refreshRequest) {
    refreshRequest = rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions)
      .finally(() => {
        refreshRequest = null;
      });
  }

  const refreshResult = await refreshRequest;
  const token = refreshResult.data?.token;
  const user = refreshResult.data?.user;

  if (!token || !user) {
    const concurrentSession = readConcurrentTabSession(tokenBeforeRefresh);
    if (concurrentSession) {
      const concurrentScope = authScope(concurrentSession.user);
      api.dispatch({ type: 'auth/setSession', payload: concurrentSession });

      if (concurrentScope !== scopeBeforeRefresh) {
        api.dispatch(baseApi.util.resetApiState());
        return result;
      }

      return rawBaseQuery(args, api, extraOptions);
    }

    clearAuthAndApiCache(api);
    return result;
  }

  // Keep the shared API transport independent from the web app module graph while
  // still using the auth slice's stable Redux action contract.
  api.dispatch({ type: 'auth/setSession', payload: { token, user } });
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Session',
    'Projects',
    'Employees',
    'Orders',
    'OrderHistory',
    'MaterialCatalog',
    'MaterialFavorites',
    'MaterialRecent',
    'Dashboard',
    'Team',
  ],
  endpoints: () => ({}),
});
