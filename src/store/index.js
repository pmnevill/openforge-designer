import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { openforgeApi } from '../api/openforgeApi';
import tileReducer from './tileSlice';

export const store = configureStore({
  reducer: {
    [openforgeApi.reducerPath]: openforgeApi.reducer,
    tiles: tileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(openforgeApi.middleware),
});

setupListeners(store.dispatch);