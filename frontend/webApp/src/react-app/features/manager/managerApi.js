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
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetTeamQuery,
  useUpdateTeamMemberMutation,
} = managerApi;
