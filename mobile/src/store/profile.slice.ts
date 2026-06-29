import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone_number: string | null;
  base_currency: string;
}

interface ProfileState {
  data: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async () => {
    const response = await api.get('/users/me');
    return response.data.data as UserProfile;
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (updates: Partial<UserProfile>) => {
    const response = await api.patch('/users/me', updates);
    return response.data.data as UserProfile;
  }
);

export const linkWhatsApp = createAsyncThunk(
  'profile/linkWhatsApp',
  async ({ userId, phoneNumber }: { userId: string, phoneNumber: string }) => {
    await api.post('/auth/link-phone', { userId, phoneNumber });
    // After linking, fetch profile again or just return the new phone number
    return phoneNumber;
  }
);

export const generateLinkCode = createAsyncThunk(
  'profile/generateLinkCode',
  async (userId: string) => {
    const response = await api.post('/auth/generate-link-code', { userId });
    return response.data.code as string;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        } else {
          state.data = action.payload;
        }
      })
      // Link WhatsApp
      .addCase(linkWhatsApp.fulfilled, (state, action: PayloadAction<string>) => {
        if (state.data) {
          state.data.phone_number = action.payload;
        }
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
