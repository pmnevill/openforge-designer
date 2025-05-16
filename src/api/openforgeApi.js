import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const openforgeApi = createApi({
  reducerPath: 'openforgeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  endpoints: (builder) => ({
    getBlueprints: builder.query({
      query: () => ({
        url: 'blueprints/tags',
        method: 'POST',
        params: { models: false, blueprints: true },
      }),
    }),
    getPartOptions: builder.query({
      query: ({ require, deny, constrain }) => ({
        url: 'blueprints/tags',
        method: 'POST',
        body: { require, deny, constrain },
      }),
    }),
  }),
});

export const { useGetBlueprintsQuery, useGetPartOptionsQuery, useLazyGetPartOptionsQuery } = openforgeApi;