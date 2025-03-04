// src/services/authService.js
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, USE_AUTH0_API } from '@env';
import {
  useAuth0,
  getCredentials as getAuth0Credentials,
} from 'react-native-auth0';
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { sendEvents } from '../store/models/events';
import {
  setToken,
  setEmail,
  logout as logoutAction,
  deleteAccountAndResetStore,
} from '../store/models/auth';
import { resetUser, unregisterNotificationsToken } from '../store/models/users';
import { getOrCreateUser } from '../store/models/users';
import * as SecureStore from 'expo-secure-store';
import { decode as atob } from 'base-64';
import { resetFirstOpenOfDay } from '../utils/first-open';
import { resetQuestionnaireAvailable } from '../utils/questionnaire-available';
import { resetDaysOpened } from '../utils/days-opened';
import { resetBoolFromStorage } from '../utils/check-bool-from-storage';
import { resetItems } from '../utils/section-badges';

const INTEGRATION_TEST_MODE = process.env.INTEGRATION_TEST_MODE === 'true';

export const useAuthService = () => {
  const [authResult, setAuthResult] = useState(null);
  const [password, setAuthServicePassword] = useState('');
  const [email, setAuthServiceEmail] = useState('');
  const dispatch = useDispatch();
  const { authorize, clearSession } = useAuth0();

  const handleEmailPasswordLogin = useCallback(async () => {
    if (INTEGRATION_TEST_MODE) {
      const testToken = 'test-token';
      const testEmail = 'test@example.com';
      await SecureStore.setItemAsync('idToken', testToken);
      await SecureStore.setItemAsync('userEmail', testEmail);
      await SecureStore.setItemAsync('refreshToken', 'test-refresh-token');

      setAuthResult({ access_token: testToken });
      dispatch(setToken(testToken));
      dispatch(setEmail(testEmail));
      return testEmail;
    }

    try {
      const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          username: email,
          password,
          audience: `https://${AUTH0_DOMAIN}/api/v2/`,
          client_id: AUTH0_CLIENT_ID,
          scope: 'openid profile email offline_access',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync('idToken', data.access_token);
        await SecureStore.setItemAsync('userEmail', email);
        await SecureStore.setItemAsync('refreshToken', data.refresh_token);

        setAuthResult(data);
        dispatch(setToken(data.access_token));
        dispatch(setEmail(email));
        return [email, ''];
      } else {
        console.error('Authentication failed', data);
        return false;
      }
    } catch (error) {
      console.error('An error occurred during authentication', error);
    }
  }, [email, password, dispatch]);

  const handleOAuthLogin = useCallback(async () => {
    if (INTEGRATION_TEST_MODE) {
      const testToken = 'test-token';
      const testEmail = 'test@example.com';
      await SecureStore.setItemAsync('idToken', testToken);
      await SecureStore.setItemAsync('userEmail', testEmail);
      await SecureStore.setItemAsync('refreshToken', 'test-refresh-token');

      setAuthResult({ accessToken: testToken });
      dispatch(setToken(testToken));
      dispatch(setEmail(testEmail));
      return [testEmail, 'Test User'];
    }

    try {
      const credentials = await authorize(
        {
          scope: 'openid profile email offline_access',
          audience: `https://${AUTH0_DOMAIN}/api/v2/`,
        },
        { ephemeralSession: false },
      );
      if (!credentials) {
        console.error('OAuth authentication failed');
        return false;
      }

      const tokenParts = credentials.idToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token structure');
      }

      const tokenData = tokenParts[1];
      const padding = '='.repeat((4 - (tokenData.length % 4)) % 4);
      const base64 = (tokenData + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const decodedToken = JSON.parse(atob(base64));
      const userName = decodedToken.given_name || decodedToken.name || decodedToken.nickname;

      await SecureStore.setItemAsync('idToken', credentials.accessToken);
      await SecureStore.setItemAsync('userEmail', decodedToken.email);
      await SecureStore.setItemAsync('refreshToken', credentials.refreshToken);

      setAuthResult(credentials);
      dispatch(setToken(credentials.accessToken));
      dispatch(setEmail(decodedToken.email));
      return [decodedToken.email, userName];
    } catch (error) {
      console.error('An error occurred during OAuth authentication', error);
      return false;
    }
  }, [dispatch]);

  const getCredentials = useCallback(async () => {
    try {
      const credentials =
        USE_AUTH0_API === 'true' ? authResult : await getAuth0Credentials();
      return credentials;
    } catch (error) {
      console.error('An error occurred while getting credentials', error);
    }
  }, [authResult]);

  const handleLogin = useCallback(async () => {
    if (USE_AUTH0_API === 'true') {
      const email = await handleEmailPasswordLogin();
      return email;
    } else {
      const email = await handleOAuthLogin();
      return email;
    }
  }, [handleEmailPasswordLogin, handleOAuthLogin]);

  const handleLogout = useCallback(async () => {
    await dispatch(sendEvents()).unwrap();
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('idToken');
    await SecureStore.deleteItemAsync('userEmail');
    // reset the AsyncStorage values
    await resetFirstOpenOfDay();
    await resetQuestionnaireAvailable();
    await resetDaysOpened();
    await resetBoolFromStorage('notificationsAsked');
    await resetItems();
    // reset store data
    dispatch(unregisterNotificationsToken());
    dispatch(resetUser());
    dispatch(setToken(null));
    dispatch(setEmail(null));
    // logout from Auth0
    if (USE_AUTH0_API === 'true') {
      dispatch(logoutAction());
    } else {
      await clearSession();
    }
  }, [dispatch]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      const result = await dispatch(deleteAccountAndResetStore()).unwrap();
      if (result) {
        await handleLogout();
      } else {
        console.error('Failed to delete the account');
      }
    } catch (error) {
      console.error('An error occurred while deleting the account', error);
    }
  }, [dispatch, handleLogout]);

  const initializeAuth = useCallback(async () => {
    if (INTEGRATION_TEST_MODE) {
      return;
    }
    const storedToken = await SecureStore.getItemAsync('idToken');
    const storedEmail = await SecureStore.getItemAsync('userEmail');
    if (storedToken && storedEmail) {
      dispatch(setToken(storedToken));
      dispatch(setEmail(storedEmail));

      try {
        await dispatch(getOrCreateUser({ email: storedEmail })).unwrap();
      } catch (error) {
        console.error('Error getting user', error);
      }
    }
  }, [dispatch]);


  return {
    authResult,
    initializeAuth,
    setAuthServiceEmail,
    setAuthServicePassword,
    handleLogin,
    handleLogout,
    getCredentials,
    handleDeleteAccount,
  };
};
