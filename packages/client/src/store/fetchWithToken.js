import { getStore } from './storeUtils';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {
  refreshAccessToken,
  logout,
} from '../utils/fetchMiddlewareAuthentication';
import AppError from '../utils/appError';

const APP_VERSION = Constants.expoConfig.version;

class Semaphore {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const tokenRefreshSemaphore = new Semaphore();

const handleErrorResponse = (response) => {
  if (response.ok) return;

  let errorType = 'UnknownError';
  let errorMessage = 'An unknown error occurred';

  switch (response.status) {
    case 404:
      errorType = 'NotFoundError';
      errorMessage = 'Resource not found';
      break;
    case 500:
      errorType = 'ServerError';
      errorMessage = 'Internal server error';
      break;
  }
  throw new AppError(errorMessage, errorType, response.status);
};

const handleTokenRefresh = async (store, currentToken, makeRequest) => {
  const currentState = store.getState();
  if (currentState.auth.token !== currentToken) {
    return await makeRequest(currentState.auth.token);
  }

  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) {
    await logout();
    throw new AppError('No refresh token available', 'AuthenticationError');
  }

  try {
    const newToken = await refreshAccessToken(refreshToken);
    return await makeRequest(newToken);
  } catch (refreshError) {
    console.error('Failed to refresh token :(', refreshError);
    await logout();
    throw new AppError('Failed to refresh token', 'AuthenticationError');
  }
};

const fetchWithToken = async (url, options = {}) => {
  const urlObj = new URL(url);
  urlObj.searchParams.append('v', APP_VERSION);
  const versionedUrl = urlObj.toString();

  const makeRequest = async (token) => {
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type')) {
      headers.append('Content-Type', 'application/json');
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    return await fetch(versionedUrl, config);
  };

  try {
    const store = getStore();
    const state = store.getState();
    let token = state.auth.token;

    let response = await makeRequest(token);

    if (response.status === 401) {
      await tokenRefreshSemaphore.acquire();
      try {
        response = await handleTokenRefresh(store, token, makeRequest);
      } finally {
        tokenRefreshSemaphore.release();
      }
    }

    handleErrorResponse(response);
    return response;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('An error occurred while fetching data', versionedUrl, error);
    if (
      error.message === 'Failed to refresh token' ||
      error.message === 'No refresh token available' ||
      error.message === 'Authentication failed'
    ) {
      throw new AppError('Authentication failed', 'AuthenticationError');
    }
    throw error;
  }
};

export default fetchWithToken;
