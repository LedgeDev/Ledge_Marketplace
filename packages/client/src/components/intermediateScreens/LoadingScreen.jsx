import React, { useRef, useEffect } from 'react';
import { View, Image, Text, Animated } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import ScreenWrapper from '../ScreenWrapper';

function LoadingScreen({ onAnimationFinished = () => {}, animationTime = 4000, fadeOut = false }) {
  /**
   * setting fadeOut to true will fade out the screen
   */
  const { t } = useTranslation();
  const initialTranslateY = 1000;
  const terminalTranslateY = -100;
  const bgFgGap = 40;
  const initialTranslateX = 500;
  const initialScale = 5;
  const fadeOutTime = 700;
  const translateYBg = useRef(new Animated.Value(initialTranslateY - bgFgGap)).current;
  const translateXBg = useRef(new Animated.Value(initialTranslateX * -1)).current;
  const translateYFg = useRef(new Animated.Value(initialTranslateY)).current;
  const translateXFg = useRef(new Animated.Value(initialTranslateX)).current;
  const blueLogoOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const firstDotOpacity = useRef(new Animated.Value(0)).current;
  const secondDotOpacity = useRef(new Animated.Value(0)).current;
  const thirdDotOpacity = useRef(new Animated.Value(0)).current;

  const moveImage = () => {
    Animated.timing(translateYBg, {
      toValue: terminalTranslateY - (bgFgGap - 20),
      duration: animationTime - 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateXBg, {
      toValue: initialTranslateX,
      duration: animationTime - 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateYFg, {
      toValue: terminalTranslateY,
      duration: animationTime - 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateXFg, {
      toValue: -1 * initialTranslateX,
      duration: animationTime - 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(blueLogoOpacity, {
      toValue: 1,
      duration: animationTime - 1000 - ((animationTime - 1000) / 2),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: fadeOutTime,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      moveImage();
      Animated.sequence([
        Animated.timing(firstDotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(secondDotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(thirdDotOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, fadeOutTime);
    setTimeout(onAnimationFinished, animationTime);
  }, []);

  useEffect(() => {
    if (fadeOut) {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: fadeOutTime,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeOut]);

  return (
    <ScreenWrapper>
      <Animated.View
        className="relative flex-1 h-full flex justify-center items-center"
        style={{ opacity: screenOpacity }}
      >
        <View className="relative w-48 h-20 mb-1 z-50">
          <Image
            source={require('../../assets/logos/logo_pink.png')}
            resizeMode="contain"
            className="absolute w-full h-full"
          />
          <Animated.Image
            source={require('../../assets/logos/logo_blue.png')}
            resizeMode="contain"
            className="absolute w-full h-full"
            style={{ opacity: blueLogoOpacity }}
          />
        </View>
        <Text className="text-lg z-50">
          { t('screens.loading.message') }
          <Animated.View style={{ opacity: firstDotOpacity }}>
            <Text>.</Text>
          </Animated.View>
          <Animated.View style={{ opacity: secondDotOpacity }}>
            <Text>.</Text>
          </Animated.View>
          <Animated.View style={{ opacity: thirdDotOpacity }}>
            <Text>.</Text>
          </Animated.View>
        </Text>
        <Animated.Image
          source={require('../../assets/images/waves-background.png')}
          resizeMode="contain"
          className="absolute w-full z-10"
          style={{ transform: [{ translateY: translateYBg }, { translateX: translateXBg }, { scale: initialScale }] }}
        />
        <Animated.Image
          source={require('../../assets/images/waves-foreground.png')}
          resizeMode="contain"
          className="absolute w-full z-10"
          style={{ transform: [{ translateY: translateYFg }, { translateX: translateXFg },{ scale: initialScale }] }}
        />
      </Animated.View>
    </ScreenWrapper>
  );
}

export default LoadingScreen;
