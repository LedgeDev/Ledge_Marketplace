import { createAsyncThunk } from '@reduxjs/toolkit';
import { setError } from './models/errorSlice';
import AppError from '../utils/appError';

export const createThunkWithErrorHandling = (typePrefix, asyncFn) =>
  createAsyncThunk(typePrefix, async (arg, thunkAPI) => {
    try {
      return await asyncFn(arg, thunkAPI);
    } catch (error) {
      const serializedError = {
        message: error.message || 'An unknown error occurred',
        type: error instanceof AppError ? error.type : 'UnexpectedError',
        name: error.name || 'Error',
        status: error.status || error.statusCode || 500,
      };

      if (![401, 403].includes(serializedError.status)) {
        thunkAPI.dispatch(setError(serializedError));
      }

      return thunkAPI.rejectWithValue(serializedError);
    }
  });
