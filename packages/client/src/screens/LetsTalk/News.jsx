import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Text,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { fetchPosts, markIdAsSeen } from '../../store/models/posts';
import PostCard from '../../components/PostCard';
import ProgressBar from '../../components/ProgressBar';
import TopBlur from '../../components/TopBlur';
import { useTranslation } from '../../hooks/useTranslation';


function News({ isActiveTab, setBadge = () => {} }) {
  const dispatch = useDispatch();
  const inNewsScreen = useIsFocused();
  const posts = useSelector(state => state.posts.posts);
  const postsStatus = useSelector(state => state.posts.status);
  const postsSeenIds = useSelector(state => state.posts.postsSeenIds);
  const postsBadgeCount = useSelector(state => state.posts.postsBadgeCount);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(!posts);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const windowHeight = Dimensions.get('window').height;
  const { t } = useTranslation();

  useEffect(() => {
    setBadge(postsBadgeCount);
  }, [postsBadgeCount]);

  useEffect(() => {
    if (!posts && postsStatus !== 'loading') {
      setPostsLoading(true);
      dispatch(fetchPosts());
    } else if (postsStatus === 'succeeded') {
      setPostsLoading(false);
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [postsStatus, dispatch, posts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchPosts());
  }, []);

  // manage the current index of the flatlist
  const onViewableItemsChanged = useCallback(async ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      const itemId = viewableItems[0].item.id;
      if (!postsSeenIds.includes(itemId)) {
        dispatch(markIdAsSeen(itemId));
      }
    }
  }, [postsSeenIds]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (postsLoading) {
    return (
      <ActivityIndicator size="large" color="#999999" />
    )
  }

  return (
    <View className="flex-1 relative">
      <TopBlur />
      <View className="relative flex-1 h-full px-7 pt-4">
        <View
          className="absolute h-40 z-20"
          style={{ left: 9, top: windowHeight / 2 - 180 }}
        >
          <ProgressBar
            totalSteps={posts.length}
            currentStep={currentIndex}
          />
        </View>
        <FlatList
          className="h-full overflow-visible"
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View
              style={{
                height: windowHeight - headerHeight,
                paddingBottom: '70%'
              }}
            >
              <PostCard
                shouldPlay={isActiveTab && inNewsScreen && index === currentIndex}
                post={item}
                visible={index === currentIndex}
                isMuted={isMuted}
                onMute={() => setIsMuted(!isMuted)}
                isNew={!postsSeenIds.includes(item.id)}
              />
              { index === posts.length - 1 && (
                <View className="w-full translate-y-28">
                  <Text className="mx-auto font-montserrat-alt">{t('letsTalk.news.uptodate')}</Text>
                </View>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          pagingEnabled
          snapToAlignment="start"
          snapToInterval={windowHeight}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>
    </View>
  );
}

export default News;
