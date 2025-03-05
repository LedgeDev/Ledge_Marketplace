import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  products: null,
  status: 'idle',
  error: null,
};

export const fetchProducts = createThunkWithErrorHandling(
  'products/fetchProducts',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/products`);
    const data = await response.json();
    return data;
  },
);

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default productsSlice.reducer;
