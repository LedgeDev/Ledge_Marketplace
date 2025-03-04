import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { BACKGROUND_IMAGES } from '../../assets/constants/loginBackgroundImages';

// Thunk for fetching random background image
export const fetchRandomBackground = createAsyncThunk(
  'loginBackgroundImages/fetchRandom',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/loginBackgroundImages');
      const url = response.data;
      console.log("Url")
    } catch (error) {
      // If there's an error, return a random local image
      const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
      return rejectWithValue(BACKGROUND_IMAGES[randomIndex]);
    }
  }
);

const loginBackgroundImagesSlice = createSlice({
  name: 'loginBackgroundImages',
  initialState: {
    currentImage: BACKGROUND_IMAGES[0], // Default to first local image
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRandomBackground.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRandomBackground.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentImage = action.payload;
        state.error = null;
      })
      .addCase(fetchRandomBackground.rejected, (state, action) => {
        state.isLoading = false;
        state.currentImage = action.payload; // Use the local image from rejectWithValue
        state.error = 'Failed to fetch remote background image';
      });
  }
});

export default loginBackgroundImagesSlice.reducer;
