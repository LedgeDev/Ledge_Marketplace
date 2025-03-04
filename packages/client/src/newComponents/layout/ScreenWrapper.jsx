import React, { useCallback, useEffect, useRef } from 'react';
import { View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventBus from 'react-native-event-bus';
import { isIPhoneSE, roundedCornerRadius } from '../../utils/device-utils';
import { useLedgeTransitions } from '../../hooks/useLedgeTransitions';

const hasSquareCorners = isIPhoneSE() || Platform.OS === 'android';

const ScreenWrapper = ({ children }) => {
  const { top } = useSafeAreaInsets();
  const { easeOut } = useLedgeTransitions();
  const dynamicBorderRadius = useRef(new Animated.Value(0)).current;

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

  const renderSafeArea = useCallback(
    () => <View style={{ height: top }} />,
    [top],
  );

  return (
    <Animated.View
      className="bg-cream flex-1 overflow-hidden"
      style={{
        borderRadius: hasSquareCorners ? dynamicBorderRadius : roundedCornerRadius,
      }}
    >
      {renderSafeArea()}
      <View className="bg-cream flex-1 justify-center items-stretch">
        {children}
      </View>
    </Animated.View>
  );
};

export default ScreenWrapper;
