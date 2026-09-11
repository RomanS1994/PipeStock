import { baseApi } from '@shared/app/api/baseApi.js';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProjects: builder.query({
      query: () => '/projects',
      transformResponse: response => response?.projects || [],
      providesTags: result => [
        { type: 'Projects', id: 'LIST' },
        ...(result || []).map(project => ({ type: 'Projects', id: project.id })),
      ],
    }),
    getProject: builder.query({
      query: projectId => `/projects/${encodeURIComponent(projectId)}`,
      transformResponse: response => response?.project || null,
      providesTags: (_result, _error, projectId) => [{ type: 'Projects', id: projectId }],
    }),
    createProject: builder.mutation({
      query: body => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Projects', id: 'LIST' },
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
    updateProject: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${encodeURIComponent(projectId)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Projects', id: projectId },
        { type: 'Projects', id: 'LIST' },
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
    getEmployees: builder.query({
      query: () => '/employees',
      transformResponse: response => response?.employees || [],
      providesTags: [{ type: 'Employees', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetEmployeesQuery,
} = projectsApi;
