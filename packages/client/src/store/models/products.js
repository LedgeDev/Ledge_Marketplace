import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  products: null,
  analyzedImages: [],
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

// Add new thunks for image analysis and product creation
export const uploadImages = createThunkWithErrorHandling(
  'products/uploadImages',
  async (images) => {
    const response = await fetchWithToken(`${BACKEND_URL}/products/analyze-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });
    const data = await response.json();
    return data;
  },
);

export const uploadSingleImage = createThunkWithErrorHandling(
  'products/uploadSingleImage',
  async (image) => {
    const response = await fetchWithToken(`${BACKEND_URL}/products/analyze-single-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    });
    const data = await response.json();
    return data;
  },
);

export const createProducts = createThunkWithErrorHandling(
  'products/createProducts',
  async (products) => {
    const response = await fetchWithToken(`${BACKEND_URL}/products/create-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });
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
      })
      // Add cases for the new thunks
      .addCase(uploadImages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.analyzedImages = action.payload;
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(uploadSingleImage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadSingleImage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // We don't need to update state here as we're handling the results in the component
      })
      .addCase(uploadSingleImage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // We could update state with the newly created products if needed
      })
      .addCase(createProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default productsSlice.reducer;
