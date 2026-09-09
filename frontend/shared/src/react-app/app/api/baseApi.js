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
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
