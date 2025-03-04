import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  data: [],
  status: 'idle',
  error: null,
  onboarding: [],
  exit: [],
  productFeedbackQuestions: null,
};

export const fetchQuestions = createThunkWithErrorHandling(
  'questions/fetchQuestions',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/questions`);
    return await response.json();
  },
);
export const fetchExitQuestion = createThunkWithErrorHandling(
  'questions/fetchExitQuestion',
  async (brandId) => {
    const response = await fetchWithToken(
      `${BACKEND_URL}/questions/ExitQuestion/${brandId}`,
    );
    return await response.json();
  },
);
export const fetchOnboardingQuestions = createThunkWithErrorHandling(
  'questions/fetchOnboardingQuestions',
  async () => {
    const response = await fetchWithToken(
      `${BACKEND_URL}/questions/onboarding`,
    );
    return await response.json();
  },
);

export const fetchPitchQuestions = createThunkWithErrorHandling(
  'questions/fetchPitchQuestions',
  async (brandId) => {
    const response = await fetchWithToken(
      `${BACKEND_URL}/questions/pitchQuestions/${brandId}`,
    );
    return await response.json();
  },
);

export const fetchProductFeedbackQuestions = createThunkWithErrorHandling(
  'questions/fetchProductFeedbackQuestions',
  async () => {
    const response = await fetchWithToken(
      `${BACKEND_URL}/questions/productFeedbackQuestions`,
    );
    return await response.json();
  },
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchOnboardingQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOnboardingQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.onboarding = action.payload;
      })
      .addCase(fetchOnboardingQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchPitchQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPitchQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchPitchQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.data = [];
        state.error = action.error.message;
      })
      .addCase(fetchExitQuestion.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchExitQuestion.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.exit = action.payload;
      })
      .addCase(fetchExitQuestion.rejected, (state, action) => {
        state.status = 'failed';
        state.exit = [];
        state.error = action.error.message;
      })
      .addCase(fetchProductFeedbackQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductFeedbackQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.productFeedbackQuestions = action.payload;
      })
      .addCase(fetchProductFeedbackQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default questionSlice.reducer;
