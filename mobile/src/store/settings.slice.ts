import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDispatch } from './index';

interface SettingsState {
  isLightMode: boolean;
}

const initialState: SettingsState = {
  isLightMode: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeLocal(state, action: PayloadAction<boolean>) {
      state.isLightMode = action.payload;
    },
  },
});

export const { setThemeLocal } = settingsSlice.actions;

export const setLightMode = (isLight: boolean) => async (dispatch: AppDispatch) => {
  dispatch(setThemeLocal(isLight));
  try {
    await AsyncStorage.setItem('@theme_isLightMode', JSON.stringify(isLight));
  } catch (e) {
    // ignore
  }
};

export const hydrateSettings = () => async (dispatch: AppDispatch) => {
  try {
    const val = await AsyncStorage.getItem('@theme_isLightMode');
    if (val !== null) {
      dispatch(setThemeLocal(JSON.parse(val)));
    }
  } catch (e) {
    // ignore
  }
};

export default settingsSlice.reducer;
