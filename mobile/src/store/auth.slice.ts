import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userId: string | null;
}

const initialState: AuthState = {
  token: null,
  userId: null,
};

// Async thunks for persistence
export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const token = await AsyncStorage.getItem('ai_finance_token');
  const userId = await AsyncStorage.getItem('ai_finance_user_id');
  return { token, userId };
});

export const setAuthAsync = createAsyncThunk(
  'auth/setAuth',
  async ({ token, userId }: { token: string; userId: string }) => {
    await AsyncStorage.setItem('ai_finance_token', token);
    await AsyncStorage.setItem('ai_finance_user_id', userId);
    return { token, userId };
  }
);

export const clearAuthAsync = createAsyncThunk('auth/clearAuth', async () => {
  await AsyncStorage.removeItem('ai_finance_token');
  await AsyncStorage.removeItem('ai_finance_user_id');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(hydrateAuth.fulfilled, (state, action) => {
      if (action.payload.token && action.payload.userId) {
        state.token = action.payload.token;
        state.userId = action.payload.userId;
      }
    });
    builder.addCase(setAuthAsync.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
    });
    builder.addCase(clearAuthAsync.fulfilled, (state) => {
      state.token = null;
      state.userId = null;
    });
  },
});

export default authSlice.reducer;
