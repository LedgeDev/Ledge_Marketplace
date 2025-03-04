import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
import { setQuestionnaireAvailable } from '../../utils/questionnaire-available';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  questionnaire: null,
  questionnaireSeenIds: [],
  questionnaireBadgeCount: 0,
  status: 'idle',
  error: null,
};

export const findMyQuestionnaire = createThunkWithErrorHandling(
  'questionnaires/myQuestionnaire',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/questionnaires/myQuestionnaire`);
    const data = await response.json();
    return data
  }
);

export const saveSeenIdsToAsyncStorage = createThunkWithErrorHandling(
  'questionnaires/saveSeenIds',
  async (_, { getState }) => {
    const { questionnaires: { questionnaireSeenIds } } = getState();
    await AsyncStorage.setItem('questionnaire:seenIds', JSON.stringify(questionnaireSeenIds));
    return questionnaireSeenIds;
  }
);

export const restoreSeenIdsFromAsyncStorage = createThunkWithErrorHandling(
  'questionnaires/restoreSeenIds',
  async () => {
    const seenIdsString = await AsyncStorage.getItem('questionnaire:seenIds');
    const seenIds = JSON.parse(seenIdsString) || [];
    return seenIds;
  }
);

// Slice
const questionnairesSlice = createSlice({
  name: 'questionnaires',
  initialState,
  reducers: {
    markIdAsSeen: (state, action) => {
      const id = action.payload;
      state.questionnaireSeenIds.push(id);
      // calculate badge count
      const currentQuestionnaire = state.questionnaire ? state.questionnaire: {};
      state.questionnaireBadgeCount = state.questionnaireSeenIds.includes(currentQuestionnaire.id) ? 0 : 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(findMyQuestionnaire.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(findMyQuestionnaire.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const questionnaire = action.payload;
        state.questionnaire = questionnaire;
        // calculate badge count
        const currentQuestionnaire = state.questionnaire ? state.questionnaire: {};
        state.questionnaireBadgeCount = state.questionnaireSeenIds.includes(currentQuestionnaire.id) ? 0 : 1;
        if (action.payload) {
          // questions are available if one of them has no answers
          const availableQuestionnaire = action.payload.questions.some((question) => !question.answers?.length > 0);
          setQuestionnaireAvailable(availableQuestionnaire);
          // this is managed this way because the questionnaire is not always available in the store
        }
      })
      .addCase(findMyQuestionnaire.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        console.error('Error fetching myQuestionnaire:', action.error.message);
      })
      .addCase(restoreSeenIdsFromAsyncStorage.fulfilled, (state, action) => {
        state.questionnaireSeenIds = action.payload;
        // calculate badge count
        const currentQuestionnaire = state.questionnaire ? state.questionnaire: {};
        state.questionnaireBadgeCount = state.questionnaireSeenIds.includes(currentQuestionnaire.id) ? 0 : 1;
      });
  },
});

export const {
  markIdAsSeen,
} = questionnairesSlice.actions;
export default questionnairesSlice.reducer;
