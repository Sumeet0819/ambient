import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import transactionsReducer from './transactions.slice';
import profileReducer from './profile.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
