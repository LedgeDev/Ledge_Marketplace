import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { resetUser } from './users';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
const INTEGRATION_TEST_MODE = process.env.INTEGRATION_TEST_MODE === 'true';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  token: null,
  email: null,
  isAuthenticated: INTEGRATION_TEST_MODE ? true : null,
};

export const deleteAccountAndResetStore = createThunkWithErrorHandling(
  'auth/deleteAccountAndResetStore',
  async (_, { dispatch }) => {
    const options = {
      method: 'DELETE',
    };

    const response = await fetchWithToken(`${BACKEND_URL}/users/`, options);
    const data = await response.json();

    await dispatch({ type: 'RESET_STORE' });
    await dispatch(resetUser());

    if (response.ok) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to delete account');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = INTEGRATION_TEST_MODE ? true : !!action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setToken, setEmail, logout } = authSlice.actions;
export default authSlice.reducer;
