import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (configuredBaseUrl) return configuredBaseUrl;
  if (import.meta.env.DEV) return 'http://localhost:3001/api';
  return '/api';
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

async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isAuthRequest(args)) return result;

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
    api.dispatch({ type: 'auth/clearSession' });
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
