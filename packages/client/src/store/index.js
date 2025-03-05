import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authMiddleware from '../middleware/authMiddleware';
import { setStore } from './storeUtils';

import userReducer from './models/users';
import questionReducer from './models/questions';
import questionnaireReducer from './models/questionnaires';
import postReducer from './models/posts';
import appVersionsReducer from './models/appVersions';
import authReducer from './models/auth';
import brandReducer from './models/brands';
import answersReducer from './models/answers';
import errorSlice from './models/errorSlice';
import feedbackReducer from './models/feedback';
import benefitsReducer from './models/benefits';
import eventsReducer from './models/events';
import loginBackgroundImagesReducer from './models/loginBackgroundImages';

const appReducer = combineReducers({
  users: userReducer,
  questions: questionReducer,
  questionnaires: questionnaireReducer,
  posts: postReducer,
  auth: authReducer,
  appVersions: appVersionsReducer,
  brands: brandReducer,
  answers: answersReducer,
  error: errorSlice,
  feedback: feedbackReducer,
  benefits: benefitsReducer,
  events: eventsReducer,
  loginBackgroundImages: loginBackgroundImagesReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'RESET_STORE') {
    return appReducer(undefined, action)
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer
});

setStore(store);

export default store;
