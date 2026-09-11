import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (configuredBaseUrl) return configuredBaseUrl;
  if (import.meta.env.DEV) return 'http://localhost:3001/api';
  return '/api';
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: resolveBaseUrl(),
    credentials: 'include',
    prepareHeaders(headers, { getState }) {
      const token = getState()?.auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Session', 'Projects', 'Employees'],
  endpoints: () => ({}),
});
