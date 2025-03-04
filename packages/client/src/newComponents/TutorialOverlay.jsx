import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import EventBus from 'react-native-event-bus';
import { useTranslation } from '../hooks/useTranslation';
import { useLedgeTransitions } from '../hooks/useLedgeTransitions';
import HandPointing from '../assets/svg/hand-pointing-white.svg';
import ArrowBendDownRight from '../assets/svg/arrow-bend-down-right-white.svg';
import ArrowBendDownLeft from '../assets/svg/arrow-bend-down-left-white.svg';

function TutorialOverlay({ onFinished }) {
  const { t } = useTranslation();
  const { easeOut } = useLedgeTransitions();
  const handTranslateY = useRef(new Animated.Value(50)).current;
  const handOpacity = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;

  // hide sidebar button when tutorial is shown, show it again when tutorial is closed
  useEffect(() => {

  }, []);

  const runAnimation = () => {
      Animated.sequence([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
        Animated.timing(handOpacity, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
        Animated.timing(handTranslateY, {
          toValue: -30,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
        Animated.timing(handOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
        Animated.timing(handTranslateY, {
          toValue: 50,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: easeOut,
        }),
      ]).start(async () => {
        await EventBus.getInstance().fireEvent("showButton", { value: true });
        onFinished();
      });
  }

  useEffect(() => {
    setTimeout(() => {
      EventBus.getInstance().fireEvent("showButton", { value:false });
      runAnimation();
    }, 1000);
  }, []);

  return (
    <Animated.View
      className="h-full w-full bg-black-600 flex flex-col items-center justify-center"
      style={{ opacity: screenOpacity }}
    >
      <Text className="text-white font-montserrat-alt-bold text-3xl text-center px-16 mb-32">
        {t('tutorials.forYou.firstTitle') + ' '}
        <Text className="text-pink-dark">
          {t('tutorials.forYou.secondTitle') + ' '}
        </Text>
        {t('tutorials.forYou.thirdTitle')}
      </Text>
      <View className="flex flex-row gap-4">
        <ArrowBendDownLeft />
        <Animated.View
          style={{
            transform: [{ translateY: handTranslateY }],
            opacity: handOpacity,
          }}
          >
          <HandPointing />
        </Animated.View>
        <ArrowBendDownRight />
      </View>
    </Animated.View>
  );
}

export default TutorialOverlay;
