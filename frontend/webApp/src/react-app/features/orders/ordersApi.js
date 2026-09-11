import { baseApi } from '@shared/app/api/baseApi.js';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProjectOrders: builder.query({
      query: projectId => `/projects/${encodeURIComponent(projectId)}/orders`,
      transformResponse: response => response?.orders || [],
      providesTags: (result, _error, projectId) => [
        { type: 'Orders', id: `PROJECT-${projectId}` },
        ...(result || []).map(order => ({ type: 'Orders', id: order.id })),
      ],
    }),
    createOrder: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${encodeURIComponent(projectId)}/orders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Orders', id: `PROJECT-${projectId}` },
      ],
    }),
    getOrder: builder.query({
      query: orderId => `/orders/${encodeURIComponent(orderId)}`,
      transformResponse: response => response?.order || null,
      providesTags: (_result, _error, orderId) => [{ type: 'Orders', id: orderId }],
    }),
    updateOrder: builder.mutation({
      query: ({ orderId, ...body }) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'PATCH', body }),
      invalidatesTags: (result, _error, { orderId }) => [
        { type: 'Orders', id: orderId },
        ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : []),
      ],
    }),
    getMaterialCatalog: builder.query({
      query: () => '/material-catalog',
      transformResponse: response => response?.items || [],
      providesTags: [{ type: 'MaterialCatalog', id: 'LIST' }],
    }),
    addOrderItem: builder.mutation({
      query: ({ orderId, ...body }) => ({ url: `/orders/${encodeURIComponent(orderId)}/items`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }],
    }),
    updateOrderItem: builder.mutation({
      query: ({ orderId, itemId, quantity }) => ({
        url: `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }],
    }),
    deleteOrderItem: builder.mutation({
      query: ({ orderId, itemId }) => ({
        url: `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }],
    }),
    submitOrder: builder.mutation({
      query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/submit`, method: 'POST' }),
      invalidatesTags: (result, _error, orderId) => [
        { type: 'Orders', id: orderId },
        ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : []),
      ],
    }),
    completeOrder: builder.mutation({
      query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/complete`, method: 'POST' }),
      invalidatesTags: (result, _error, orderId) => [
        { type: 'Orders', id: orderId },
        ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : []),
      ],
    }),
  }),
});

export const {
  useGetProjectOrdersQuery,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  useGetMaterialCatalogQuery,
  useAddOrderItemMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
  useSubmitOrderMutation,
  useCompleteOrderMutation,
} = ordersApi;
