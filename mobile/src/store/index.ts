import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import transactionsReducer from './transactions.slice';
import profileReducer from './profile.slice';
import settingsReducer from './settings.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
    profile: profileReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
