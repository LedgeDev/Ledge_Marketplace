import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';

const INTEGRATION_TEST_MODE = process.env.INTEGRATION_TEST_MODE === 'true';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  data: INTEGRATION_TEST_MODE ? { id: "664a28c6ab587d72477e8b96", username: "test_user" } : null,
  status: 'idle',
  error: null,
  navbarMessage: null,
  posts: null,
  categoriesOnboarding: null,
  swipingQuestion: null,
  contentViews: [],
  locationAnswer: null,
};

export const fetchCurrentUser = createThunkWithErrorHandling(
  'users/fetchCurrentUser',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/users/`);
    return await response.json();
  },
);

export const setViewedPitch = createThunkWithErrorHandling(
  'users/setViewedPitch',
  async (brandId) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', brandId },
      body: JSON.stringify({ brandId }),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/viewedPitch`,options);
    return await response.json();
  },
);

export const getOrCreateUser = createThunkWithErrorHandling(
  'users/getOrCreateUser',
  async (userData) => {
    const { email, name } = userData;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/`, options);
    const data = await response.json();

    if (response.status === 404) {
      const createUserResponse = await fetchWithToken(
        `${BACKEND_URL}/users/`,
        options,
      );
      return await createUserResponse.json();
    }
    return data;
  },
);

export const getUser = createThunkWithErrorHandling(
  'users/getUser',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/users/`);
    const data = await response.json();
    return data;
  },
);

export const getUserNavbarMessage = createThunkWithErrorHandling(
  'users/navbarMessage',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/users/navbarMessage`);
    return await response.json();
  },
);

export const removeMyFavourite = createThunkWithErrorHandling(
  'users/removeMyFavourite',
  async (brandId) => {
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/myFavourites`,
      options,
    );
    return await response.json();
  },
);

export const addMyFavourite = createThunkWithErrorHandling(
  'users/addMyFavourite',
  async (brandId) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/myFavourites`,
      options,
    );
    return await response.json();
  },
);

export const dislikeBrand = createThunkWithErrorHandling(
  'users/dislikeBrand',
  async (brandId) => {
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/likes`,
      options,
    );
    return await response.json();
  },
);

export const likeBrand = createThunkWithErrorHandling(
  'users/likeBrand',
  async (brandId) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/likes`,
      options,
    );
    return await response.json();
  },
);

export const resetUser = createThunkWithErrorHandling(
  'users/resetUser',
  async () => null,
);

export const registerNotificationsToken = createThunkWithErrorHandling(
  'users/registerNotificationsToken',
  async (data) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/registerNotificationsToken`,
      options,
    );
    return await response.json();
  },
);

export const unregisterNotificationsToken = createThunkWithErrorHandling(
  'users/unregisterNotificationsToken',
  async (data) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/users/unregisterNotificationsToken`,
      options,
    );
    return await response.json();
  },
);

export const patchUser = createThunkWithErrorHandling(
  'users/patchUser',
  async (userData) => {
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/`, options);
    return await response.json();
  },
);

export const changeEmail = createThunkWithErrorHandling(
  'users/changeEmail',
  async (userData) => {
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/changeEmail`, options);
    return await response.json();
  },
);

export const postOnboardingAnswers = createThunkWithErrorHandling(
  'users/postOnboardingAnswers',
  async (answers) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers),
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/users/onboarding`,
      options,
    );
    const data = await response.json();

    // Return both the response data and the location answer
    return {
      ...data,
      locationAnswer: answers[process.env.LOCATION_QUESTION_ID] || null
    };
  },
);

export const poolRefill = createThunkWithErrorHandling(
  'users/poolRefill',
  async ({ answer }) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answer),
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/users/poolRefill`,
      options,
    );
    return await response.json();
  },
);

export const getInterestedCategories = createThunkWithErrorHandling(
  'users/interestedCategories',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/users/interestedCategories`);
    return await response.json();
  },
);

export const addBrandScreenTime = createThunkWithErrorHandling(
  'users/brandScreenTimes',
  async (data) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/users/brandScreenTimes`,
      options,
    );
    return await response.json();
  },
);

export const addLinkVisit = createThunkWithErrorHandling(
  'users/linkVisits',
  async (data) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/users/linkVisits`,
      options,
    );
    return await response.json();
  },
);

export const saveContentViews = createThunkWithErrorHandling(
  'users/addContentViews',
  async (_, { getState }) => {
    const { contentViews } = getState().users;
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentViews),
    };

    const response = await fetchWithToken(
      `${BACKEND_URL}/users/contentViews`,
      options,
    );
    return await response.json();
  },
);

export const updateUserWelcomeSeen = createThunkWithErrorHandling(
  'users/updateUserWelcomeSeen',
  async () => {
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasCompletedOnboarding: true }),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/`, options);
    return await response.json();
  },
);

export const updateUserProfile = createThunkWithErrorHandling(
  'users/updateUserProfile',
  async (userData) => {
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    };
    const response = await fetchWithToken(`${BACKEND_URL}/users/profile`, options);
    return await response.json();
  },
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    optimisticRemoveMyFavourite: (state, action) => {
      if (state.data && state.data.myFavourites) {
        state.data.myFavourites = state.data.myFavourites.filter(
          (id) => id !== action.payload,
        );
      }
    },
    optimisticAddMyFavourite: (state, action) => {
      if (
        state.data &&
        state.data.myFavourites
      ) {

        // Get current brands Ids
        const currentBrandsIds = state.data.myFavourites.map((fav) => fav.brandId);

        // Check if the brandId is already in the list
        if (!currentBrandsIds.includes(action.payload)) {

          const favoriteObject = {
            brandId: action.payload,
            addedAt: new Date().toISOString()
          }

          state.data.myFavourites.push(favoriteObject);
        }
      }
    },
    addContentViews: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.contentViews.push(...action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getOrCreateUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getOrCreateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(getOrCreateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getUserNavbarMessage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getUserNavbarMessage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.navbarMessage = action.payload.message;
      })
      .addCase(getUserNavbarMessage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(removeMyFavourite.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(removeMyFavourite.fulfilled, (state, action) => {
        state.status = 'succeeded';

        // Check if the user myFavourites changed. If not, don't update the state
        if (!state.data.myFavourites.includes(action.payload)) {
          return;
        }
        state.data.myFavourites = action.payload;
      })
      .addCase(removeMyFavourite.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addMyFavourite.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addMyFavourite.fulfilled, (state, action) => {
        state.status = 'succeeded';

        // Get the brands Ids on my favourites
        const currentBrandsIds = state.data.myFavourites.map((fav) => fav.brandId);

        // Check if the user myFavourites changed. If not, don't update the state
        if (currentBrandsIds.includes(action.payload)) {
          return;
        }

        const newMyFavourite = {
          brandId: action.payload,
          addedAt: new Date().toISOString()
        }

        state.data.myFavourites.push(newMyFavourite);
      })
      .addCase(addMyFavourite.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(resetUser.fulfilled, (state) => {
        state.data = null;
      })
      .addCase(registerNotificationsToken.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(registerNotificationsToken.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload
      })
      .addCase(registerNotificationsToken.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(unregisterNotificationsToken.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(unregisterNotificationsToken.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(unregisterNotificationsToken.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(patchUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(patchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(patchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(changeEmail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(changeEmail.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(changeEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(setViewedPitch.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setViewedPitch.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(setViewedPitch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(postOnboardingAnswers.pending, (state, action) => {
        state.status = 'loading';
        const answers = action.meta.arg;
        state.locationAnswer = answers[process.env.LOCATION_QUESTION_ID] || null;
      })
      .addCase(postOnboardingAnswers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categoriesOnboarding = action.payload;
      })
      .addCase(postOnboardingAnswers.rejected, (state, action) => {
        state.status = 'failed';
        console.log("postOnboardingAnswers.rejected");
        state.error = action.error.message;
      })
      .addCase(poolRefill.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(poolRefill.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(poolRefill.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getInterestedCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getInterestedCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { question, interestedCategories } = action.payload;
        state.swipingQuestion = question;
        state.categoriesOnboarding = interestedCategories;
      })
      .addCase(getInterestedCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addBrandScreenTime.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addBrandScreenTime.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(addBrandScreenTime.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addLinkVisit.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addLinkVisit.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(addLinkVisit.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(saveContentViews.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveContentViews.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.contentViews = [];
      })
      .addCase(saveContentViews.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(dislikeBrand.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(dislikeBrand.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(dislikeBrand.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(likeBrand.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(likeBrand.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(likeBrand.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateUserWelcomeSeen.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateUserWelcomeSeen.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(updateUserWelcomeSeen.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

const { optimisticRemoveMyFavourite, optimisticAddMyFavourite, addContentViews } =
  userSlice.actions;
export { optimisticRemoveMyFavourite, optimisticAddMyFavourite, addContentViews };
saveContentViews
export default userSlice.reducer;
