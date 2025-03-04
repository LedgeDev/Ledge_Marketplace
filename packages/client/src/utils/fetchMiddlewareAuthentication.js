import store from '../store';
import {
  setToken,
  logout as logoutAction,
  setEmail,
} from '../store/models/auth'; // Import your setToken action
import * as SecureStore from 'expo-secure-store';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '@env';
import { resetFirstOpenOfDay } from '../utils/first-open';
import { resetQuestionnaireAvailable } from '../utils/questionnaire-available';
import { resetDaysOpened } from '../utils/days-opened';

export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: AUTH0_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();

  // Update stored tokens
  store.dispatch(setToken(data.access_token));
  await SecureStore.setItemAsync('refreshToken', data.refresh_token);
  await SecureStore.setItemAsync('idToken', data.id_token);

  return data.access_token;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync('idToken');
  await SecureStore.deleteItemAsync('userEmail');
  await SecureStore.deleteItemAsync('refreshToken');
  // reset async storage values
  await resetFirstOpenOfDay();
  await resetQuestionnaireAvailable();
  await resetDaysOpened();
  store.dispatch(setToken(null));
  store.dispatch(setEmail(null));
  store.dispatch(logoutAction());
};
