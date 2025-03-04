import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
  AppState,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import BrandCard from './BrandCard';
import PlayButton from './PlayButton';
import { getForYouBrands, markForYouIdAsSeen } from '../../store/models/brands';
import { fetchPosts } from '../../store/models/posts';
import { fetchBenefits } from '../../store/models/benefits';
import { addContentViews, saveContentViews } from '../../store/models/users';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import NoDataWarning from '../../components/NoDataWarning';
import ProgressBar from '../../newComponents/ProgressBar';
import { useNotifications } from '../../hooks/useNotifications';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useTranslation } from '../../hooks/useTranslation';
import { checkBoolFromStorage } from '../../utils/check-bool-from-storage';
import { toggleMute } from '../../store/models/brands';
import Mute from '../../assets/svg/mute.svg';
import UnMute from '../../assets/svg/unMute.svg';

const screenHeight = Dimensions.get('window').height;

const ForYou = ({ isActiveTab, onLoaded = () => {}, setBadge = () => {} }) => {
  const { t } = useTranslation();
  const screenFocused = useIsFocused();
  const navigation = useNavigation();
  const analytics = useAnalytics();
  const inExploreScreen = useMemo(() => isActiveTab && screenFocused && navigation.isFocused(), [isActiveTab, screenFocused, navigation]);
  const dispatch = useDispatch();
  const { askAndRegisterForPushNotifications } = useNotifications();
  const forYouBrands = useSelector((state) => state.brands.forYouBrands);
  const nextForYouBrand = useSelector((state) => state.brands.nextForYouBrand);
  const userForYouBrands = useMemo(() => forYouBrands, [forYouBrands, nextForYouBrand]);
  const brandsStatus = useSelector((state) => state.brands.status);
  const forYouSeenIds = useSelector((state) => state.brands.forYouSeenIds);
  const forYouBadgeCount = useSelector((state) => state.brands.forYouBadgeCount);
  const postsStatus = useSelector((state) => state.posts.status);
  const benefitsStatus = useSelector((state) => state.benefits.status);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMuted = useSelector((state) => state.brands.isMuted);
  const [notificationsAsked, setNotificationsAsked] = useState(null);
  const contentViews = useSelector((state) => state.users.contentViews);
  const initialFetchDone = useRef(false);
  const uiOpacity = useSharedValue(1);

  // we keep track of the brands seen by the user, related to the feature of sleeper brands
  const addSeenIdByIndex = useCallback((index) => {
    if (inExploreScreen && userForYouBrands && userForYouBrands[index]?.id) {
      const brandId = userForYouBrands[index].id;
      if (!contentViews.some(view => view.contentId === brandId) && !(nextForYouBrand?.id === brandId)) {
        dispatch(addContentViews([{
          section: 'forYou',
          contentId: brandId,
          contentType: 'brand',
          increment: 1
        }]))
      }
    }
  }, [userForYouBrands, contentViews, inExploreScreen, nextForYouBrand]);

  useEffect(() => {
    setBadge(forYouBadgeCount);
  }, [forYouBadgeCount]);

  useEffect(() => {
    addSeenIdByIndex(currentIndex);
  }, [currentIndex, inExploreScreen, userForYouBrands]);

  const handleMuteToggle = () => {
    dispatch(toggleMute());
  };

  // notifications are asked here because this is the first screen once the app and contents are loaded
  useEffect(() => {
    const checkAndSetNotificationsAsked = async () => {
      const userAskedForNotifications = await checkBoolFromStorage('notificationsAsked');
      if (!userAskedForNotifications) {
        askAndRegisterForPushNotifications();
      }
    };
    if (!notificationsAsked) {
      checkAndSetNotificationsAsked();
      setNotificationsAsked(true);
    }
  }, [askAndRegisterForPushNotifications]);

  const dispatchBrands = useCallback(async () => {
    await Promise.all([
      dispatch(getForYouBrands()).unwrap(),
      dispatch(fetchPosts()).unwrap(),
      dispatch(fetchBenefits()).unwrap(),
    ]);
    onLoaded();
    initialFetchDone.current = true;
  }, [initialFetchDone.current]);

  useEffect(() => {
    if ((!initialFetchDone.current || !userForYouBrands) && brandsStatus !== 'loading' && postsStatus !== 'loading' && benefitsStatus !== 'loading') {
      dispatchBrands();
    }
  }, [userForYouBrands, initialFetchDone.current, brandsStatus, postsStatus, benefitsStatus]);

  useEffect(() => {
    const eventListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await Promise.all([
          dispatch(getForYouBrands()).unwrap(),
          dispatch(fetchPosts()).unwrap(),
          dispatch(fetchBenefits()).unwrap(),
        ]);
      } else if (nextAppState === 'background') {
        // save the content views to the backend when the app goes to background
        await dispatch(saveContentViews()).unwrap();
      }
    });
    return () => {
      eventListener.remove();
    };
  }, [currentIndex, addSeenIdByIndex]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getForYouBrands()).unwrap();
    addSeenIdByIndex(currentIndex);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [inExploreScreen]);

  const handleBrandPress = (brand) => {
    analytics.capture('Brand list item pressed', {
      brandId: brand.id,
      brandName: brand.name,
      origin: 'For You',
      position: userForYouBrands.map(b => b.id).indexOf(brand.id) + 1,
      type: 'brandListItemPressed',
      details: { 
        origin: 'For You',
        position: userForYouBrands.map(b => b.id).indexOf(brand.id) + 1
      },
    });
    navigation.navigate('Brand Profile', { brand });
  }

  // manage the current index of the flatlist
  const onViewableItemsChanged = useCallback(async ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      const itemId = viewableItems[0].item.id;
      // mark new item as seen
      if (!forYouSeenIds.includes(itemId) && inExploreScreen) {
        dispatch(markForYouIdAsSeen(itemId));
      }
    }
  }, [forYouSeenIds, inExploreScreen]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const hideUI = useCallback(() => {
    uiOpacity.value = 0;
  }, []);

  const showUI = useCallback(() => {
    uiOpacity.value = 1;
  }, []);

  const uiAnimatedOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(uiOpacity.value, { duration: 100 }),
  }));

  if (userForYouBrands && userForYouBrands.length === 0 && !refreshing) {
    return <NoDataWarning component="ForYou" onRefresh={handleRefresh} refreshing={refreshing} />;
  }

  if (!userForYouBrands) {
    return <ActivityIndicator className="flex-1" size="large" color="#999999" />;
  }

  const renderItem = ({ item, index }) => {
    return (
      <View
        className="w-full overflow-hidden"
        style={{
          height: screenHeight,
        }}
      >
        <BrandCard
          brand={{ ...item }}
          shouldPlay={isActiveTab && inExploreScreen && currentIndex === index}
          isMuted={isMuted}
          onMute={handleMuteToggle}
          isNew={!forYouSeenIds.includes(item.id)}
          onNamePress={handleBrandPress}
        />
      </View>
    );
  }

  return (
    <Animated.View
      className="relative flex-1 flex-row w-full h-full overflow-visible"
    >
      <View className="z-30 absolute top-0 left-0 bottom-0 flex flex-col justify-center">
        <View
          className="absolute h-40 pl-2"
        >
          <ProgressBar
            totalSteps={userForYouBrands.length}
            currentStep={currentIndex}
            horizontal={false}
            scaleFactor={1.62}
            showBorder={false}
            bgColor="white"
          />
        </View>
      </View>
      <View
        className="relative z-10 w-full h-full overflow-visible"
      >
          <FlatList
            className="overflow-visible"
            data={userForYouBrands}
            keyExtractor={(item, index) => item.id.toString() + index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            pagingEnabled
            snapToInterval={screenHeight}
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            disableIntervalMomentum
            onScrollBeginDrag={hideUI}
            onMomentumScrollEnd={showUI}
            bounces={false}
          />
          <Animated.View
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={[uiAnimatedOpacity]}
          >
            <PlayButton brand={userForYouBrands[currentIndex]} parentTabName="For You" />
          </Animated.View>
          <Animated.View
            className="absolute bottom-8 left-0 w-full px-7 flex flex-row justify-between items-center"
            style={[uiAnimatedOpacity]}
          >
            <TouchableOpacity
              className="opacity-80"
              onPress={handleMuteToggle}
            >
              {isMuted ? (
                <Mute width={24} height={24} />
              ) : (
                <UnMute width={24} height={24} />
              )}
            </TouchableOpacity>
            { currentIndex !== userForYouBrands.length - 1 && (
              <Text className="text-white font-inter-regular opacity-70">
                {t('explore.swipeUp')}
              </Text>
            )}
            <View className="w-8 h-8 rounded-full bg-transparent" />
          </Animated.View>
      </View>
    </Animated.View>
  );
};

export default ForYou;
