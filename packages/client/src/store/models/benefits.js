import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  levelBenefits: null,
  levelBenefitsSeenIds: [],
  levelBenefitsBadgeCount: 0,
  nextLevelBenefits: null,
  status: 'idle',
  error: null,
};

export const fetchBenefits = createThunkWithErrorHandling(
  'benefits/myBenefits',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/benefits/myBenefits`);
    const data = await response.json();
    return data
  }
);

export const saveSeenIdsToAsyncStorage = createThunkWithErrorHandling(
  'benefits/saveSeenIds',
  async (_, { getState }) => {
    const { benefits: { levelBenefitsSeenIds } } = getState();
    await AsyncStorage.setItem('benefits:seenIds', JSON.stringify(levelBenefitsSeenIds));
    return levelBenefitsSeenIds;
  }
);

export const restoreSeenIdsFromAsyncStorage = createThunkWithErrorHandling(
  'benefits/restoreSeenIds',
  async () => {
    const seenIdsString = await AsyncStorage.getItem('benefits:seenIds');
    const seenIds = JSON.parse(seenIdsString) || [];
    return seenIds;
  }
);

// Slice
const benefitsSlice = createSlice({
  name: 'benefits',
  initialState,
  reducers: {
    markIdAsSeen: (state, action) => {
      const id = action.payload;
      state.levelBenefitsSeenIds.push(id);
      // calculate badge count
      const currentBenefits = state.levelBenefits ? state.levelBenefits.map((benefit) => benefit.id) : [];
      state.levelBenefitsBadgeCount = currentBenefits.filter((id) => !state.levelBenefitsSeenIds.includes(id)).length;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBenefits.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBenefits.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { levelBenefits, nextLevelBenefits } = action.payload;
        state.levelBenefits = levelBenefits;
        state.nextLevelBenefits = nextLevelBenefits;
        // calculate badge count
        const currentBenefits = state.levelBenefits ? state.levelBenefits.map((benefit) => benefit.id) : [];
        state.levelBenefitsBadgeCount = currentBenefits.filter((id) => !state.levelBenefitsSeenIds.includes(id)).length;
      })
      .addCase(fetchBenefits.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        console.error('Error fetching benefits:', action.error.message);
      })
      .addCase(restoreSeenIdsFromAsyncStorage.fulfilled, (state, action) => {
        state.levelBenefitsSeenIds = action.payload;
        // calculate badge count
        const currentBenefits = state.levelBenefits ? state.levelBenefits.map((benefit) => benefit.id) : [];
        state.levelBenefitsBadgeCount = currentBenefits.filter((id) => !state.levelBenefitsSeenIds.includes(id)).length;
      });
  },
});

export const {
  markIdAsSeen,
} = benefitsSlice.actions;
export default benefitsSlice.reducer;
