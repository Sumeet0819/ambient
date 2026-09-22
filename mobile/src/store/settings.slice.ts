import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDispatch } from './index';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
}

const initialState: SettingsState = {
  themeMode: 'system',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeLocal(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
  },
});

export const { setThemeLocal } = settingsSlice.actions;

export const setThemeMode = (mode: ThemeMode) => async (dispatch: AppDispatch) => {
  dispatch(setThemeLocal(mode));
  try {
    await AsyncStorage.setItem('@theme_mode', mode);
  } catch (e) {
    // ignore
  }
};

export const hydrateSettings = () => async (dispatch: AppDispatch) => {
  try {
    const val = await AsyncStorage.getItem('@theme_mode');
    if (val !== null && ['light', 'dark', 'system'].includes(val)) {
      dispatch(setThemeLocal(val as ThemeMode));
    }
  } catch (e) {
    // ignore
  }
};

export default settingsSlice.reducer;
