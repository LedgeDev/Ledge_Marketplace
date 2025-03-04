import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { View, Image, Text, Animated, Dimensions } from 'react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useTranslation } from '../../hooks/useTranslation';
import ScreenWrapper from '../../components/ScreenWrapper';
import LedgeProgress from '../../components/LedgeProgress';
import Waves from '../../assets/svg/waves.svg';
import levelColors from '../../utils/level-colors';

function LevelAnimationScreen({ oldUser, newUser, onFinished = null }) {
  const { t } = useTranslation();
  const analytics = useAnalytics();
  const oldLevelColors = levelColors(oldUser.level.order);
  const newLevelColors = levelColors(newUser.level.order);
  const windowWidth = Dimensions.get('window').width;
  const initialTranslateYText = 300;
  const initialTranslateY = 900;
  const terminalTranslateY = -120;
  const bgFgGap = 40;
  const initialTranslateX = 15;
  const initialScale = 5;
  const animationTime = 1000;
  const translateYBg = useRef(new Animated.Value(initialTranslateY - bgFgGap)).current;
  const translateXBg = useRef(new Animated.Value(initialTranslateX - (windowWidth * initialScale) + windowWidth)).current;
  const translateYFg = useRef(new Animated.Value(initialTranslateY)).current;
  const translateXFg = useRef(new Animated.Value(initialTranslateX)).current;
  const translateYText = useRef(new Animated.Value(initialTranslateYText)).current;
  const opacityText = useRef(new Animated.Value(0)).current;
  const opacityOldLevel = useRef(new Animated.Value(1)).current;
  const opacityNewLevel = useRef(new Animated.Value(0)).current;
  const opacityNewWaves = useRef(new Animated.Value(0)).current;
  const [forceFullPercentage, setForceFullPercentage] = useState(true);

  const firstStepAnimations = [
    // move waves up
    Animated.timing(translateYBg, {
      toValue: terminalTranslateY - bgFgGap,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateXBg, {
      toValue: initialTranslateX,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateYFg, {
      toValue: terminalTranslateY,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateXFg, {
      // final position is the initial position minus the width of the window (width of the wave) 
      // times the scale, plus the width of the window to make it coincide with the right border
      toValue: initialTranslateX - (windowWidth * initialScale) + windowWidth,
      duration: animationTime,
      useNativeDriver: true,
    }),
    // move text up and make it appear
    Animated.timing(translateYText, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(opacityText, {
      toValue: 1,
      duration: animationTime,
      useNativeDriver: true,
    }),
  ];

  const secondStepAnimations = [
    // make the new color waves appear
    Animated.timing(opacityNewWaves, {
      toValue: 1,
      duration: animationTime,
      useNativeDriver: true,
    }),
  ];

  const thirdStepAnimations = [
    // move text up and make new LedgeProgress appear
    Animated.timing(translateYText, {
      toValue: -200,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(opacityNewLevel, {
      toValue: 1,
      duration: animationTime,
      useNativeDriver: true,
    }),
    // make old LedgeProgress disappear
    Animated.timing(opacityOldLevel, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true,
    }),
  ];

  const fourthStepAnimations = [
    // move waves down
    Animated.timing(translateYBg, {
      toValue: initialTranslateY - bgFgGap,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateXBg, {
      toValue: initialTranslateX - (windowWidth * initialScale) + windowWidth,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateYFg, {
      toValue: initialTranslateY,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(translateXFg, {
      toValue: initialTranslateX,
      duration: animationTime,
      useNativeDriver: true,
    }),
    // move text down and make it disappear
    Animated.timing(translateYText, {
      toValue: 800,
      duration: animationTime,
      useNativeDriver: true,
    }),
    Animated.timing(opacityText, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true,
    }),
  ];


  useEffect(() => {
    analytics.capture("Level upgraded", {
      oldLevelId: oldUser.level?.id || null,
      oldLevelName: oldUser.level?.name || null,
      newLevelId: newUser.level?.id || null,
      newLevelName: newUser.level?.name || null,
      date: new Date().toISOString(),
      type: 'levelUpgraded',
      details: {
        oldLevelId: oldUser.level?.id || null,
        oldLevelName: oldUser.level?.name || null,
        newLevelId: newUser.level?.id || null,
        newLevelName: newUser.level?.name || null,
        date: new Date().toISOString(),
      }
    });
    // execute animations with 2 seconds of delay between each step
    Animated.stagger(1500, [
      Animated.parallel(firstStepAnimations),
      Animated.parallel(secondStepAnimations),
      Animated.parallel(thirdStepAnimations),
      Animated.parallel(fourthStepAnimations),
    ]).start();
    setTimeout(() => setForceFullPercentage(false), 4500);
    if (onFinished) {
      setTimeout(() => onFinished(), 6500);
      return;
    }
  }, []);

  return (
    <ScreenWrapper>
      <View
        className="relative flex-1 flex justify-center items-center"
      >
        <Animated.View className="absolute z-20 h-64 w-full px-7" style={{ opacity: opacityOldLevel }}>
          <LedgeProgress
            user={oldUser}
          />
        </Animated.View>
        <Animated.View className="absolute z-30 h-64 w-full px-7" style={{ opacity: opacityNewLevel }}>
          <LedgeProgress
            user={newUser}
            border={true}
            forcedPercentage={forceFullPercentage ? 100 : null}
          />
        </Animated.View>
        <Animated.View
          className="z-30 px-4"
          style={{ transform: [{ translateY: translateYText }], opacity: opacityText }}
        >
          <Text className="text-3xl text-white text-center font-montserrat-alt">{ t('levelAnimation.title')}</Text>
        </Animated.View>
        {/* background waves */}
        {/* old color wave */}
        <Animated.View
          className="absolute top-0 left-0 w-full z-10"
          style={{ transform: [{ translateY: translateYBg }, { translateX: translateXBg }, { scale: initialScale }], transformOrigin: 'top left' }}
        >
          <Waves style={{ color: oldLevelColors.bg }} />
        </Animated.View>
        {/* new color wave */}
        <Animated.View
          className="absolute top-0 left-0 w-full z-10"
          style={{ transform: [{ translateY: translateYBg }, { translateX: translateXBg }, { scale: initialScale }], transformOrigin: 'top left', opacity: opacityNewWaves }}
        >
          <Waves style={{ color: newLevelColors.bg }} />
        </Animated.View>
        {/* foreground waves */}
        {/* old color wave */}
        <Animated.View
          className="absolute top-0 left-0 w-full z-20"
          style={{ transform: [{ translateY: translateYFg }, { translateX: translateXFg },{ scale: initialScale }], transformOrigin: 'top left' }}
        >
          <Waves style={{ color: oldLevelColors.dark }} />
        </Animated.View>
        {/* new color wave */}
        <Animated.View
          className="absolute top-0 left-0 w-full z-20"
          style={{ transform: [{ translateY: translateYFg }, { translateX: translateXFg },{ scale: initialScale }], transformOrigin: 'top left', opacity: opacityNewWaves }}
        >
          <Waves style={{ color: newLevelColors.dark }} />
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

export default LevelAnimationScreen;