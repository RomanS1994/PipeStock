import { createSlice } from '@reduxjs/toolkit';
import { clearStoredAuth, readStoredAuth, saveStoredAuth } from './authStorage.js';

const stored = readStoredAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: stored.token, user: stored.user, hydrated: false },
  reducers: {
    setSession(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.hydrated = true;
      saveStoredAuth(state.token, state.user);
    },
    setUser(state, action) {
      state.user = action.payload;
      state.hydrated = true;
      if (state.token) saveStoredAuth(state.token, state.user);
    },
    clearSession(state) {
      state.token = '';
      state.user = null;
      state.hydrated = true;
      clearStoredAuth();
    },
    markHydrated(state) {
      state.hydrated = true;
    },
  },
});

export const { setSession, setUser, clearSession, markHydrated } = authSlice.actions;
export const selectAuth = state => state.auth;
export const selectUser = state => state.auth.user;
export const selectToken = state => state.auth.token;
export default authSlice.reducer;
