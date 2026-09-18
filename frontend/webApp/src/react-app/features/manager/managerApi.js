import { baseApi } from '@shared/app/api/baseApi.js';

export const managerApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: [{ type: 'Dashboard', id: 'SUMMARY' }],
    }),
    getTeam: builder.query({
      query: () => '/team',
      transformResponse: response => response?.members || [],
      providesTags: result => [
        { type: 'Team', id: 'LIST' },
        ...(result || []).map(member => ({ type: 'Team', id: member.membershipId })),
      ],
    }),
    getTeamInvite: builder.query({
      query: () => '/team/invite',
      transformResponse: response => response?.invite || null,
      providesTags: [{ type: 'Team', id: 'INVITE' }],
    }),
    regenerateTeamInvite: builder.mutation({
      query: () => ({ url: '/team/invite', method: 'POST' }),
      invalidatesTags: [{ type: 'Team', id: 'INVITE' }],
    }),
    revokeTeamInvite: builder.mutation({
      query: () => ({ url: '/team/invite', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Team', id: 'INVITE' }],
    }),
    updateTeamMember: builder.mutation({
      query: ({ membershipId, status }) => ({
        url: `/team/${encodeURIComponent(membershipId)}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { membershipId }) => [
        { type: 'Team', id: membershipId },
        { type: 'Team', id: 'LIST' },
        { type: 'Employees', id: 'LIST' },
        'Projects',
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
    removeTeamMember: builder.mutation({
      query: ({ membershipId }) => ({
        url: `/team/${encodeURIComponent(membershipId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { membershipId }) => [
        { type: 'Team', id: membershipId },
        { type: 'Team', id: 'LIST' },
        { type: 'Employees', id: 'LIST' },
        'Projects',
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetTeamQuery,
  useGetTeamInviteQuery,
  useRegenerateTeamInviteMutation,
  useRevokeTeamInviteMutation,
  useUpdateTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = managerApi;
