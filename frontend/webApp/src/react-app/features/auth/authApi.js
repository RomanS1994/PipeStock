import { baseApi } from '@shared/app/api/baseApi.js';
import { clearSession, setSession, setUser } from './authSlice.js';

function applySession(dispatch, payload) {
  if (payload?.token && payload?.user) dispatch(setSession({ token: payload.token, user: payload.user }));
}

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: body => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        applySession(dispatch, data);
      },
    }),
    registerManager: builder.mutation({
      query: body => ({ url: '/auth/register-manager', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        applySession(dispatch, data);
      },
    }),
    registerEmployee: builder.mutation({
      query: body => ({ url: '/auth/register-employee', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        applySession(dispatch, data);
      },
    }),
    joinCompany: builder.mutation({
      query: body => ({ url: '/auth/join-company', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        if (data?.user) dispatch(setUser(data.user));
      },
    }),
    refreshSession: builder.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          applySession(dispatch, data);
        } catch {
          // A concurrent browser tab may have already rotated the shared refresh cookie.
          // baseApi/storage synchronization decides whether the local session should clear.
        }
      },
    }),
    currentUser: builder.query({
      query: () => '/me',
      providesTags: ['Session'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) dispatch(setUser(data.user));
        } catch {
          // Session refresh bootstrap handles expired access tokens.
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try { await queryFulfilled; } finally { dispatch(clearSession()); }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterManagerMutation,
  useRegisterEmployeeMutation,
  useJoinCompanyMutation,
  useRefreshSessionMutation,
  useCurrentUserQuery,
  useLogoutMutation,
} = authApi;
