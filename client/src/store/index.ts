import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import characterReducer from './characterSlice';
import gameReducer from './gameSlice';
import cssLoadingReducer from './cssLoadingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    character: characterReducer,
    game: gameReducer,
    cssLoading: cssLoadingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;