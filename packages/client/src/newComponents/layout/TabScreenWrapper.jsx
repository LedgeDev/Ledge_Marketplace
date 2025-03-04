import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventBus from 'react-native-event-bus';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from './ScreenWrapper';
import BadgeIndicator from '../BadgeIndicator';
import Tabs from './Tabs';
import { useLedgeTransitions } from '../../hooks/useLedgeTransitions';
import { isIPhoneSE, roundedCornerRadius } from '../../utils/device-utils';

const screenWidth = Dimensions.get('window').width;
const hasSquareCorners = isIPhoneSE();

const TabScreenWrapper = ({
  tabs, // [{ name: 'tab1', component: Tab1Component, fullscreen: bool, headerComponent: Tab1HeaderComponent }, ...}]
  showOpeningAnimation = false,
 }) => {
  const insets = useSafeAreaInsets();
  const [viewableTabs, setViewableTabs] = useState([]);
  const [tab1Badge, setTab1Badge] = useState(0);
  const [tab2Badge, setTab2Badge] = useState(0);
  // const tabBackgroundOpacity = useRef(new Animated.Value(tabs[0].fullscreen ? 1 : 0)).current;
  // const headerTranslateY = useRef(new Animated.Value(showOpeningAnimation ? -700 : 0)).current;
  // const contentTranslateY = useRef(new Animated.Value(showOpeningAnimation ? 1000 : 0)).current;
  // const headerOpacity = useRef(new Animated.Value(showOpeningAnimation ? 0 : 1)).current;
  // const contentOpacity = useRef(new Animated.Value(showOpeningAnimation ? 0 : 1)).current;
  const flatListRef = useRef(null);
  const { openingTransition, openingTransitionTime, easeOut } = useLedgeTransitions();
  const transitionToFullscreen = useSharedValue(tabs[0].fullscreen ? 1 : 0);
  const dynamicBorderRadius = useSharedValue(hasSquareCorners ? 0 : roundedCornerRadius);
  const dynamicBorderRadiusAnimatedStyle = useAnimatedStyle(() => ({
    borderRadius: dynamicBorderRadius.value,
  }));

  useFocusEffect(
    useCallback(() => {
      handleNavbarButtonTransparency(viewableTabs);
      return () => {
        EventBus.getInstance().fireEvent("setNavbarButtonTransparent", { value: false });
      }
    }, [viewableTabs])
  );

  // code for animation pending

  const handleTabSelection = (index) => {
    flatListRef.current.scrollToIndex({ index, animated: true });
  };

  const handleNavbarButtonTransparency = useCallback((viewableTabs) => {
    if (tabs[viewableTabs[0]]?.fullscreen) {
      EventBus.getInstance().fireEvent("setNavbarButtonTransparent", { value: true });
    } else {
      EventBus.getInstance().fireEvent("setNavbarButtonTransparent", { value: false });
    }
  }, [tabs]);

  useEffect(() => {
    const roundedCornersListener = EventBus.getInstance().addListener("setRoundedCorners", (data) => {
      if (hasSquareCorners) {
        dynamicBorderRadius.value = withTiming(data.value ? roundedCornerRadius : 0, { duration: 300, easing: Easing.out(Easing.quad) });
      }
    });

    // Cleanup listeners on component unmount
    return () => {
      EventBus.getInstance().removeListener(roundedCornersListener);
    };
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 3
  };

  const renderItem = useCallback(({ item, index }) => {
    const TabComponent = item.component;
    if (item.fullscreen) {
      return (
        <View style={{ width: screenWidth }}>
          <TabComponent
            isActiveTab={viewableTabs.includes(index)}
          />
        </View>
      );
    }
    return (
      <View style={{ width: screenWidth }}>
        <ScreenWrapper>
          <View className="relative py-4 z-30 invisible">
            <Tabs
              tabNames={tabs.map((tab) => tab.name)}
              selectedTab={viewableTabs[0]}
            />
          </View>
          <TabComponent />
        </ScreenWrapper>
      </View>
    );
  }, [viewableTabs]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    // We make the incoming item the last item in the viewableTabs array
    // NO CAMBIAR ACTUALIZAR VIEABLE TABS SI NO CAMBIAN REALMENTE
    const newViewableTabs = viewableItems.map(item => item.index);
    if (newViewableTabs.length > 1) {
      setViewableTabs(prev => {
        if (prev.length > 1) {
          return prev;
        }
        const newTab = newViewableTabs.find(tab => !prev.includes(tab));
        return [...prev, newTab];
      });
    } else {
      setViewableTabs(newViewableTabs); 
    }
  }, [setViewableTabs]);

  const handleScroll = useAnimatedScrollHandler((event) => {
    // interpolate between 1 and 0
    const offsetX = event.contentOffset.x;
    const maxOffsetX = screenWidth - 10; // subtract 10 because the scroll value is not precise at the end
    const normalizedOffsetX = 1 - (offsetX / maxOffsetX);
    transitionToFullscreen.value = normalizedOffsetX;
  });

  return (
    <View className={`overflow-hidden`}>
      <Animated.View
        className="bg-cream relative h-full w-full overflow-hidden"
        style={dynamicBorderRadiusAnimatedStyle}

      >
        {/* <ScreenWrapper> */}
          <View className="relative flex-1 flex justify-center w-full z-20">
            {/* header */}
            <Animated.View
              className="absolute top-0 left-0 right-0 py-4 z-30 flex flex-row justify-center"
              style={{
                marginTop: insets.top,
              }}
            >
              <Tabs
                tabNames={tabs.map((tab) => tab.name)}
                onTabSelection={handleTabSelection}
                selectedTab={viewableTabs.slice(-1)[0]}
                transitionToFullscreen={transitionToFullscreen}
              />
            </Animated.View>
            {/* content */}
            <Animated.View
              className="flex-1 overflow-visible z-10"
            >
              <Animated.FlatList
                className="overflow-visible z-10"
                ref={flatListRef}
                data={tabs}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialNumToRender={2}
                maxToRenderPerBatch={1}
                windowSize={2}
                keyExtractor={(item) => item.name}
                onScroll={handleScroll}
                getItemLayout={(data, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                bounces={false}
              />
            </Animated.View>
          </View>
        {/* </ScreenWrapper> */}
      </Animated.View>
    </View>
  );
};

export default TabScreenWrapper;