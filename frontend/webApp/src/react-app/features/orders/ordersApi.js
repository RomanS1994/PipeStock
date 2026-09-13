import { baseApi } from '@shared/app/api/baseApi.js';

async function readPdfResponse(response) {
  const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const blob = await response.blob();

  if (contentType !== 'application/pdf') {
    throw new Error('Expected a PDF response');
  }

  const signature = new TextDecoder('ascii').decode(await blob.slice(0, 5).arrayBuffer());
  if (signature !== '%PDF-') {
    throw new Error('Invalid PDF response');
  }

  return blob.type === 'application/pdf'
    ? blob
    : new Blob([blob], { type: 'application/pdf' });
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getOrders: builder.query({ query: () => '/orders', transformResponse: response => response?.orders || [], providesTags: result => [{ type: 'Orders', id: 'GLOBAL' }, ...(result || []).map(order => ({ type: 'Orders', id: order.id }))] }),
    getProjectOrders: builder.query({ query: projectId => `/projects/${encodeURIComponent(projectId)}/orders`, transformResponse: response => response?.orders || [], providesTags: (result, _error, projectId) => [{ type: 'Orders', id: `PROJECT-${projectId}` }, ...(result || []).map(order => ({ type: 'Orders', id: order.id }))] }),
    createOrder: builder.mutation({ query: ({ projectId, ...body }) => ({ url: `/projects/${encodeURIComponent(projectId)}/orders`, method: 'POST', body }), invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Orders', id: `PROJECT-${projectId}` }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }] }),
    getOrder: builder.query({ query: orderId => `/orders/${encodeURIComponent(orderId)}`, transformResponse: response => response?.order || null, providesTags: (_result, _error, orderId) => [{ type: 'Orders', id: orderId }] }),
    getOrderHistory: builder.query({ query: orderId => `/orders/${encodeURIComponent(orderId)}/history`, transformResponse: response => response?.events || [], providesTags: (_result, _error, orderId) => [{ type: 'OrderHistory', id: orderId }] }),
    updateOrder: builder.mutation({ query: ({ orderId, ...body }) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'PATCH', body }), invalidatesTags: (result, _error, { orderId }) => [{ type: 'Orders', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }, ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : [])] }),
    deleteOrder: builder.mutation({
      query: ({ orderId }) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { orderId, projectId }) => [
        { type: 'Orders', id: orderId },
        { type: 'OrderHistory', id: orderId },
        { type: 'Orders', id: 'GLOBAL' },
        { type: 'Dashboard', id: 'SUMMARY' },
        ...(projectId ? [{ type: 'Orders', id: `PROJECT-${projectId}` }] : []),
      ],
    }),
    downloadOrderPdf: builder.mutation({ query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/pdf`, method: 'GET', responseHandler: readPdfResponse, cache: 'no-store' }) }),
    getMaterialCatalog: builder.query({ query: () => '/material-catalog', transformResponse: response => response?.items || [], providesTags: [{ type: 'MaterialCatalog', id: 'LIST' }] }),
    getFavoriteMaterials: builder.query({ query: () => '/materials/favorites', transformResponse: response => response?.items || [], providesTags: [{ type: 'MaterialFavorites', id: 'LIST' }] }),
    getRecentMaterials: builder.query({ query: () => '/materials/recent', transformResponse: response => response?.items || [], providesTags: [{ type: 'MaterialRecent', id: 'LIST' }] }),
    addFavoriteMaterial: builder.mutation({ query: catalogItemId => ({ url: `/materials/favorites/${encodeURIComponent(catalogItemId)}`, method: 'POST' }), invalidatesTags: [{ type: 'MaterialFavorites', id: 'LIST' }] }),
    removeFavoriteMaterial: builder.mutation({ query: catalogItemId => ({ url: `/materials/favorites/${encodeURIComponent(catalogItemId)}`, method: 'DELETE' }), invalidatesTags: [{ type: 'MaterialFavorites', id: 'LIST' }] }),
    addOrderItem: builder.mutation({ query: ({ orderId, ...body }) => ({ url: `/orders/${encodeURIComponent(orderId)}/items`, method: 'POST', body }), invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'MaterialRecent', id: 'LIST' }, { type: 'Dashboard', id: 'SUMMARY' }] }),
    updateOrderItem: builder.mutation({ query: ({ orderId, itemId, quantity }) => ({ url: `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`, method: 'PATCH', body: { quantity } }), invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }] }),
    deleteOrderItem: builder.mutation({ query: ({ orderId, itemId }) => ({ url: `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}`, method: 'DELETE' }), invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Orders', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }] }),
    submitOrder: builder.mutation({ query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/submit`, method: 'POST' }), invalidatesTags: (result, _error, orderId) => [{ type: 'Orders', id: orderId }, { type: 'OrderHistory', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }, ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : [])] }),
    completeOrder: builder.mutation({ query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/complete`, method: 'POST' }), invalidatesTags: (result, _error, orderId) => [{ type: 'Orders', id: orderId }, { type: 'OrderHistory', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }, ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : [])] }),
  }),
});

export const {
  useGetOrdersQuery, useGetProjectOrdersQuery, useCreateOrderMutation, useGetOrderQuery, useGetOrderHistoryQuery, useUpdateOrderMutation,
  useDeleteOrderMutation, useDownloadOrderPdfMutation, useGetMaterialCatalogQuery, useGetFavoriteMaterialsQuery,
  useGetRecentMaterialsQuery, useAddFavoriteMaterialMutation, useRemoveFavoriteMaterialMutation, useAddOrderItemMutation,
  useUpdateOrderItemMutation, useDeleteOrderItemMutation, useSubmitOrderMutation, useCompleteOrderMutation,
} = ordersApi;
