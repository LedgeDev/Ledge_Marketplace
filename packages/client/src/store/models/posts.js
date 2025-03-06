import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';

const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  posts: null,
  postsSeenIds: [],
  postsBadgeCount: 0,
  status: 'idle',
  error: null,
};

export const fetchPosts = createThunkWithErrorHandling(
  'posts/fetchPosts',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/posts`);
    const data = await response.json();
    return data;
  },
);

export const likePost = createThunkWithErrorHandling(
  'posts/likePost',
  async ({ id, like }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/posts/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ like: like }),
    });
    const data = await response.json();
    return data
  }
);

export const saveSeenIdsToAsyncStorage = createThunkWithErrorHandling(
  'posts/saveSeenIds',
  async (_, { getState }) => {
    const { posts: { postsSeenIds } } = getState();
    await AsyncStorage.setItem('news:seenIds', JSON.stringify(postsSeenIds));
    return postsSeenIds;
  }
);

export const restoreSeenIdsFromAsyncStorage = createThunkWithErrorHandling(
  'posts/restoreSeenIds',
  async () => {
    const seenIdsString = await AsyncStorage.getItem('news:seenIds');
    const seenIds = JSON.parse(seenIdsString) || [];
    return seenIds;
  }
);

// Slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    markIdAsSeen: (state, action) => {
      const id = action.payload;
      state.postsSeenIds.push(id);
      // calculate badge count
      const currentPosts = state.posts ? state.posts.map((post) => post.id) : [];
      state.postsBadgeCount = currentPosts.filter((id) => !state.postsSeenIds.includes(id)).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const posts = action.payload;
        state.posts = posts;
        // calculate badge count
        const currentPosts = state.posts ? state.posts.map((post) => post.id) : [];
        state.postsBadgeCount = currentPosts.filter((id) => !state.postsSeenIds.includes(id)).length;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(likePost.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(likePost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedPost = action.payload;
        state.posts = state.posts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        );
      })
      .addCase(likePost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(restoreSeenIdsFromAsyncStorage.fulfilled, (state, action) => {
        state.postsSeenIds = action.payload;
        // calculate badge count
        const currentPosts = state.posts ? state.posts.map((post) => post.id) : [];
        state.postsBadgeCount = currentPosts.filter((id) => !state.postsSeenIds.includes(id)).length;
      });
  },
});

export const {
  markIdAsSeen,
} = postsSlice.actions;
export default postsSlice.reducer;
