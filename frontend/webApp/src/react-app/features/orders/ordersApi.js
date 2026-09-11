import { baseApi } from '@shared/app/api/baseApi.js';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getOrders: builder.query({ query: () => '/orders', transformResponse: response => response?.orders || [], providesTags: result => [{ type: 'Orders', id: 'GLOBAL' }, ...(result || []).map(order => ({ type: 'Orders', id: order.id }))] }),
    getProjectOrders: builder.query({ query: projectId => `/projects/${encodeURIComponent(projectId)}/orders`, transformResponse: response => response?.orders || [], providesTags: (result, _error, projectId) => [{ type: 'Orders', id: `PROJECT-${projectId}` }, ...(result || []).map(order => ({ type: 'Orders', id: order.id }))] }),
    createOrder: builder.mutation({ query: ({ projectId, ...body }) => ({ url: `/projects/${encodeURIComponent(projectId)}/orders`, method: 'POST', body }), invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Orders', id: `PROJECT-${projectId}` }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }] }),
    getOrder: builder.query({ query: orderId => `/orders/${encodeURIComponent(orderId)}`, transformResponse: response => response?.order || null, providesTags: (_result, _error, orderId) => [{ type: 'Orders', id: orderId }] }),
    getOrderHistory: builder.query({ query: orderId => `/orders/${encodeURIComponent(orderId)}/history`, transformResponse: response => response?.events || [], providesTags: (_result, _error, orderId) => [{ type: 'OrderHistory', id: orderId }] }),
    updateOrder: builder.mutation({ query: ({ orderId, ...body }) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'PATCH', body }), invalidatesTags: (result, _error, { orderId }) => [{ type: 'Orders', id: orderId }, { type: 'Orders', id: 'GLOBAL' }, { type: 'Dashboard', id: 'SUMMARY' }, ...(result?.order?.project?.id ? [{ type: 'Orders', id: `PROJECT-${result.order.project.id}` }] : [])] }),
    downloadOrderPdf: builder.mutation({ query: orderId => ({ url: `/orders/${encodeURIComponent(orderId)}/pdf`, method: 'GET', responseHandler: response => response.blob(), cache: 'no-store' }) }),
    getMaterialCatalog: builder.query({ query: () => '/material-catalog', transformResponse: response => response?.items || [], providesTags: [{ type: 'MaterialCatalog', id: 'LIST' }] }),
    updateMaterialImage: builder.mutation({ query: ({ catalogItemId, imageUrl }) => ({ url: `/material-catalog/${encodeURIComponent(catalogItemId)}/image`, method: 'PATCH', body: { imageUrl } }), invalidatesTags: [{ type: 'MaterialCatalog', id: 'LIST' }, { type: 'MaterialFavorites', id: 'LIST' }, { type: 'MaterialRecent', id: 'LIST' }] }),
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
  useDownloadOrderPdfMutation, useGetMaterialCatalogQuery, useUpdateMaterialImageMutation, useGetFavoriteMaterialsQuery,
  useGetRecentMaterialsQuery, useAddFavoriteMaterialMutation, useRemoveFavoriteMaterialMutation, useAddOrderItemMutation,
  useUpdateOrderItemMutation, useDeleteOrderItemMutation, useSubmitOrderMutation, useCompleteOrderMutation,
} = ordersApi;
