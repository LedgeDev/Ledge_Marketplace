import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
import { updateSectionNewItemsAndItems } from '../../utils/section-badges';
import { setBoolInStorage } from '../../utils/check-bool-from-storage';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  data: null,
  status: 'idle',
  error: null,
  brands: null,
  forYouBrands: null,
  forYouSeenIds: [],
  forYouBadgeCount: 0,
  discoveryBrands: null,
  myFavourites: null,
  myDeals: null,
  isMuted:false,
  nextForYouBrand: null,
  searchResults: null,
};

export const getBrands = createThunkWithErrorHandling(
  'brands/get',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands`);
    const data = await response.json();
    return data;
  },
);

export const getForYouBrands = createThunkWithErrorHandling(
  'brands/forYouBrands',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/forYouBrands`);
    const data = await response.json();
    return data;
  },
);

export const getDiscoveryBrands = createThunkWithErrorHandling(
  'brands/discoveryBrands',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/discovery`);
    return await response.json();
  },
);

export const fetchMyFavourites = createThunkWithErrorHandling(
  'brands/fetchMyFavourites',
  async () => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await fetchWithToken(
      `${BACKEND_URL}/brands/myFavourites`,
      options,
    );
    return await response.json();
  },
);

export const fetchMyDeals = createThunkWithErrorHandling(
  'brands/myDeals',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/myDeals`);
    return await response.json();
  },
);


export const sendBrandFeedback = createThunkWithErrorHandling(
  'feedback/sendBrandFeedback',
  async ({ brandId, text, email }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId, text, email }),
    });
    return await response.json();
  },
);

export const fetchBrandAndRemoveFromDeletedBrands = createThunkWithErrorHandling(
  'brands/fetchBrandAndRemoveFromDeletedBrands',
  async (brandId, { getState }) => {

    const url = `${BACKEND_URL}/brands/getAndRemoveFromDeleted/${brandId}`;

    const response = await fetchWithToken(
      url,
    );
    const data = await response.json();
    return data;
  },
);



export const fetchBrand = createThunkWithErrorHandling(
  'brands/fetchBrand',
  async (brandId, { getState }) => {
    const state = getState().brands;

    const dealBrand = state.myDeals?.find((brand) => brand.id === brandId);

    if (dealBrand) return dealBrand;

    const favoriteBrand = state.myFavourites?.find(
      (brand) => brand.id === brandId,
    );

    if (favoriteBrand) return favoriteBrand;

    const url = `${BACKEND_URL}/brands/${brandId}`;

    const response = await fetchWithToken(
      url,
    );
    const data = await response.json();
    return data;
  },
);

export const fetchBrandsByIds = createThunkWithErrorHandling(
  'brands/fetchBrandsByIds',
  async (brandIds, { rejectWithValue }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/byIds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandIds }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return rejectWithValue(errorData);
    }

    return await response.json();
  },
);
export const removeDeleted = createThunkWithErrorHandling(
  'brands/removeFromDeleted',
  async (brandIds, { rejectWithValue }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/removeFromDeleted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandIds }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return rejectWithValue(errorData);
    }
    return await response.json();
  },
);

export const saveSeenIdsToAsyncStorage = createThunkWithErrorHandling(
  'brands/saveSeenIds',
  async (_, { getState }) => {
    const { brands: { forYouSeenIds } } = getState();
    await AsyncStorage.setItem('forYou:seenIds', JSON.stringify(forYouSeenIds));
    return forYouSeenIds;
  }
);

export const restoreSeenIdsFromAsyncStorage = createThunkWithErrorHandling(
  'brands/restoreSeenIds',
  async () => {
    const seenIdsString = await AsyncStorage.getItem('forYou:seenIds');
    const seenIds = JSON.parse(seenIdsString) || [];
    return seenIds;
  }
);

export const searchBrands = createThunkWithErrorHandling(
  'brands/searchBrands',
  async (query) => {
    const response = await fetchWithToken(`${BACKEND_URL}/brands/search?query=${query}`);
    return await response.json();
  },
);

// Slice
const brandSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    removeMyFavourite: (state, action) => {
      state.myFavourites = state.myFavourites.filter(
        (brand) => brand.id !== action.payload,
      );
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    markForYouIdAsSeen: (state, action) => {
      const id = action.payload;
      state.forYouSeenIds.push(id);
      // calculate badge count
      const currentForYouBrandIds = state.forYouBrands ? state.forYouBrands.map((brand) => brand.id) : [];
      state.forYouBadgeCount = currentForYouBrandIds.filter((id) => !state.forYouSeenIds.includes(id)).length;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.brands = action.payload;
      })
      .addCase(getBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getForYouBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getForYouBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { forYouBrands, nextForYouBrand } = action.payload;
        state.forYouBrands = forYouBrands;
        state.nextForYouBrand = nextForYouBrand;
        const res = action.payload;
        if (res && res.forYouBrandsPoolIds?.length === 0 && res.brandsAvailableForPool) {
          setBoolInStorage('poolNeedsRefill', true);
        }
        const currentForYouBrandIds = state.forYouBrands ? state.forYouBrands.map((brand) => brand.id) : [];
        state.forYouBadgeCount = currentForYouBrandIds.filter((id) => !state.forYouSeenIds.includes(id)).length;
      })
      .addCase(getForYouBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(getDiscoveryBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getDiscoveryBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.discoveryBrands = action.payload;
      })
      .addCase(getDiscoveryBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchMyFavourites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyFavourites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.myFavourites = action.payload;
      })
      .addCase(fetchMyFavourites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(sendBrandFeedback.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendBrandFeedback.fulfilled, (state) => {
        state.status = 'succeeded';
        // Handle successful feedback submission if needed
      })
      .addCase(sendBrandFeedback.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchMyDeals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyDeals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myDeals = action.payload;
      })
      .addCase(fetchMyDeals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchBrand.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBrand.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchBrand.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(restoreSeenIdsFromAsyncStorage.fulfilled, (state, action) => {
        state.forYouSeenIds = action.payload;
        // calculate badge count
        const currentForYouBrandIds = state.forYouBrands ? state.forYouBrands.map((brand) => brand.id) : [];
        state.forYouBadgeCount = currentForYouBrandIds.filter((id) => !state.forYouSeenIds.includes(id)).length;
      })
      .addCase(searchBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.searchResults = action.payload;
      })
      .addCase(searchBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const {
  removeMyFavourite,
  toggleMute,
  markForYouIdAsSeen,
  clearSearchResults,
} = brandSlice.actions;
export default brandSlice.reducer;
