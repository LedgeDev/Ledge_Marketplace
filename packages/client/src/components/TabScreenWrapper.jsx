import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  LayoutAnimation,
} from 'react-native';
import EventBus from 'react-native-event-bus';
import ScreenWrapper from './ScreenWrapper';
import BadgeIndicator from './BadgeIndicator';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';
import { isIPhoneSE, roundedCornerRadius } from '../utils/device-utils';

const screenWidth = Dimensions.get('window').width;
const tabHeight = 44;
const hasSquareCorners = isIPhoneSE();

const TabScreenWrapper = React.memo(({
  tab1Name,
  tab2Name,
  Tab1Component,
  Tab2Component,
  t,
  onBrandPress,
  onBenefitPress,
  showOpeningAnimation,
  onTab1Load = () => {},
  currentBenefit,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tab1Badge, setTab1Badge] = useState(0);
  const [tab2Badge, setTab2Badge] = useState(0);
  const flatListRef = useRef(null);
  const tab1UnderlineWidth = useRef(0);
  const tab2UnderlineWidth = useRef(0);
  const dynamicBorderRadius = useRef(new Animated.Value(0)).current;
  const { openingTransition, openingTransitionTime, easeOut } = useLedgeTransitions();
  const headerTranslateY = useRef(new Animated.Value(showOpeningAnimation ? -700 : 0)).current;
  const contentTranslateY = useRef(new Animated.Value(showOpeningAnimation ? 1000 : 0)).current;
  const headerOpacity = useRef(new Animated.Value(showOpeningAnimation ? 0 : 1)).current;
  const contentOpacity = useRef(new Animated.Value(showOpeningAnimation ? 0 : 1)).current;
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineJustifyContent, setUnderlineJustifyContent] = useState('stretch');
  const [viewableTabs, setViewableTabs] = useState([]);

  useEffect(() => {
    const roundedCornersListener = EventBus.getInstance().addListener("setRoundedCorners", (data) => {
      if (hasSquareCorners) {
        Animated.timing(dynamicBorderRadius, {
          toValue: data.value ? roundedCornerRadius : 0,
          duration: 300,
          useNativeDriver: false,
          easing: easeOut,
        }).start();
      }
    });

    // Cleanup listeners on component unmount
    return () => {
      EventBus.getInstance().removeListener(roundedCornersListener);
    };
  }, []);

  // Animate underline movement
  useEffect(() => {
    const width = getTabUnderlineWidth(viewableTabs);
    const justifyContent = getTabUnderlineJustifyContent(viewableTabs);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setUnderlineWidth(width);
    setUnderlineJustifyContent(justifyContent);
  }, [viewableTabs]);

  const getTabUnderlineWidth = useCallback((tabs) => {
    if (tabs.slice(-1)[0] === 0) {
      return tab1UnderlineWidth.current;
    } else if (tabs.slice(-1)[0] === 1) {
      return tab2UnderlineWidth.current;
    }
    return 0;
  }, []);

  const getTabUnderlineJustifyContent = useCallback((tabs) => {
    if (tabs.slice(-1)[0] === 0) {
      return 'flex-start';
    } else if (tabs.slice(-1)[0] === 1) {
      return 'flex-end';
    }
    return null;
  }, []);

  const handleTab1Load = useCallback(async () => {
    await onTab1Load();
    if (showOpeningAnimation) {
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: openingTransitionTime,
          useNativeDriver: true,
          easing: openingTransition,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: openingTransitionTime,
          useNativeDriver: true,
          easing: openingTransition,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: openingTransitionTime + 500,
          useNativeDriver: true,
          easing: openingTransition,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: openingTransitionTime + 500,
          useNativeDriver: true,
          easing: openingTransition,
        }),
      ]).start();
    }
  }, [showOpeningAnimation]);

  const handleTabPress = useCallback((tabIndex) => {
    if (selectedTab !== tabIndex) {
      setSelectedTab(tabIndex);
      flatListRef.current?.scrollToIndex({ index: tabIndex, animated: true });
    }
  }, [selectedTab]);

  const renderTab = useCallback((tabName, isSelected, notifications) => (
    <TouchableOpacity
      onPress={() => handleTabPress(tabName === tab1Name ? 0 : 1)}
      onLayout={(event) => {
        if (tabName === tab1Name) {
          tab1UnderlineWidth.current = event.nativeEvent.layout.width;
        } else {
          tab2UnderlineWidth.current = event.nativeEvent.layout.width;
        }
      }}
    >
      <View className="relative">
        <Text
          className={`px-4 py-2 text-center text-ledge-black text-md ${isSelected ? 'font-montserrat-alt-bold' : 'font-montserrat-alt'}`}
          maxFontSizeMultiplier={1.5}
        >
          {t(tabName)}
        </Text>
        <View className="absolute top-[1] right-[1]">
          <BadgeIndicator count={notifications} />
        </View>
      </View>
    </TouchableOpacity>
  ), [handleTabPress, t]);

  const renderItem = useCallback(({ index }) => {
    return (
      <View className="overflow-visible" style={{ width: screenWidth }}>
        {index === 0 ? (
          <Tab1Component
            isActiveTab={viewableTabs.includes(0)}
            setBadge={setTab1Badge}
            onLoaded={handleTab1Load}
            setHeaderVisibility={setHeaderVisibility}
          />
        ) : (
          <Tab2Component
            isActiveTab={viewableTabs.includes(1)}
            setBadge={setTab2Badge}
            setHeaderVisibility={setHeaderVisibility}
            onBrandPress={onBrandPress}
            onBenefitPress={onBenefitPress}
            currentBenefit={currentBenefit}
          />
        )}
      </View>
    );
  }, [selectedTab, setTab1Badge, setTab2Badge, onBrandPress, onBenefitPress, currentBenefit, viewableTabs]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    // We make the incoming item the last item in the viewableTabs array
    if (viewableItems.length === 2) {
      setViewableTabs(prev => {
        if (prev.length === 2) {
          return prev;
        } 
        const newTab = viewableItems.find(item => !prev.includes(item.index));
        return [...prev, newTab.index];
      });
    } else {
      setViewableTabs(viewableItems.map(item => item.index));
    }
    if (viewableItems.length === 1) {
      setSelectedTab(viewableItems[0].index);
    }
  }, [setSelectedTab]);

  const setHeaderVisibility = useCallback((value) => {
    Animated.timing(headerOpacity, {
      toValue: value ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);


  const viewabilityConfig = {
    itemVisiblePercentThreshold: 3
  };

  return (
    <View className={`overflow-hidden`}>
      <Animated.View
        className="bg-cream relative h-full w-full overflow-hidden"
        style={{
          borderRadius: hasSquareCorners ? dynamicBorderRadius : roundedCornerRadius,
        }}
      >
        <ScreenWrapper>
          <View className="flex-1 flex justify-center w-full z-20">
            <Animated.View
              className="relative flex-row justify-center pb-3 pt-1 z-30"
              style={{
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
                height: tabHeight,
              }}
            >
              <View className="flex flex-row">
                {renderTab(tab1Name, viewableTabs.slice(-1)[0] === 0, tab1Badge)}
                {renderTab(tab2Name, viewableTabs.slice(-1)[0] === 1, tab2Badge)}
                {/* title underline */}
                <View
                  className="absolute bottom-1.5 h-1.5 w-full -z-10 opacity-60 flex flex-row"
                  style={{
                    justifyContent: underlineJustifyContent,
                  }}
                >
                  <View
                    className="px-3"
                    style={{
                      width: underlineWidth,
                    }}
                  >
                    <View className="bg-pink h-full w-full rounded-full"/>
                  </View>
                </View>
              </View>
            </Animated.View>
            <Animated.View
              className="flex-1 overflow-visible z-10"
              style={{
                transform: [{ translateY: contentTranslateY }],
                opacity: contentOpacity,
              }}
            >
              <FlatList
                className="overflow-visible z-10"
                ref={flatListRef}
                data={[{ key: 'tab1' }, { key: 'tab2' }]}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                keyExtractor={(item) => item.key}
              />
            </Animated.View>
          </View>
        </ScreenWrapper>
      </Animated.View>
    </View>
  );
});

export default TabScreenWrapper;
