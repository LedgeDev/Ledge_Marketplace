import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
import { setBoolInStorage } from '../../utils/check-bool-from-storage';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  answers: null,
  status: 'idle',
  error: null,
  categoriesOnboarding: null,
};

export const createAnswer = createThunkWithErrorHandling(
  'answers/create',
  async (data, { dispatch }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    dispatch(findSortedAnswers());
    return await response.json();
  },
);

export const findAnswers = createThunkWithErrorHandling(
  'answers/find',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers`);
    return await response.json();
  },
);

export const findSortedAnswers = createThunkWithErrorHandling(
  'answers/findSorted',
  async (params) => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers/sorted`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await response.json();
  },
);

export const patchAnswer = createThunkWithErrorHandling(
  'answers/patch',
  async ({ id, data }, { dispatch }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    dispatch(findSortedAnswers());
    return await response.json();
  },
);

export const deleteAnswers = createThunkWithErrorHandling(
  'answers/delete',
  async (data, { dispatch }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
    dispatch(findSortedAnswers());
    return response;
  },
);

export const postPitchAnswers = createThunkWithErrorHandling(
  'answers/postPitchAnswers',
  async (data, { rejectWithValue }) => {
    const { brandId, answers, pitch } = data; // Include pitch here
    const payload = {
      answers,
      pitch // Add pitch to the payload
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload), // Send the updated payload
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/answers/pitchAnswers/${brandId}`,
      options,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      return rejectWithValue(
        `Server error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  },
);

export const sendProductFeedback = createThunkWithErrorHandling(
  'answers/sendProductFeedback',
  async (data, { dispatch }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/answers/productFeedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  },
);

// Slice
const answersSlice = createSlice({
  name: 'answers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAnswer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createAnswer.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createAnswer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(findAnswers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(findAnswers.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(findAnswers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(findSortedAnswers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(findSortedAnswers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.answers = action.payload;
      })
      .addCase(findSortedAnswers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(patchAnswer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(patchAnswer.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(patchAnswer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(deleteAnswers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteAnswers.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(deleteAnswers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(postPitchAnswers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(postPitchAnswers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload;
        if (user && user.forYouBrandsPoolIds?.length === 0 && user.brandsAvailableForPool) {
          setBoolInStorage('poolNeedsRefill', true);
        }
      })
      .addCase(postPitchAnswers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(sendProductFeedback.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendProductFeedback.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(sendProductFeedback.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default answersSlice.reducer;
