import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import ScreenWrapper from '../ScreenWrapper';
import Button from '../../components/Button';
import ArrowRight from '../../assets/svg/arrow-right-pink-2.svg';
import Info from '../../assets/svg/info.svg';
import { checkBoolFromStorage } from '../../utils/check-bool-from-storage';
import { useExternalUrl } from '../../hooks/useExternalUrl';


function WelcomeScreen({ onNext = () => {}, onSkip = () => {}, children } ) {
  const { t } = useTranslation();
  const { openExternalUrl } = useExternalUrl();
  const [back, setBack] = useState(false);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const fadeOutTime = 300;

  useEffect(() => {
    checkBoolFromStorage('hasCompletedOnboarding').then((hasCompletedBefore) => {
      setBack(hasCompletedBefore);
    });
  }, []);

  const defaultText = (
    <Text className="text-center text-lg">
      { back? t('screens.welcome.subtitleBack') : t('screens.welcome.subtitle') }
    </Text>
  );

  const next = useCallback(() => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: fadeOutTime,
      useNativeDriver: true,
    }).start();
    setTimeout(onNext, fadeOutTime);
  }, [onNext]);

  const skip = useCallback(() => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: fadeOutTime,
      useNativeDriver: true,
    }).start();
    setTimeout(onSkip, fadeOutTime);
  }, [onSkip]);

  return (
    <ScreenWrapper>
      <Animated.View
        className="relative flex-1 flex justify-center px-7"
        style={{ opacity: screenOpacity }}
      >
        <View className="absolute top-10 right-0 px-7 flex flex-row justify-end">
          <Button
            appendIcon={<ArrowRight />}
            color="gray"
            onPress={skip}
          >
            <Text className="text-pink-dark">
              { t('screens.welcome.skip') }
            </Text>
          </Button>
        </View>
        <View className="flex justify-center items-center gap-16">
          <View className="px-2">
            <Text className="text-center font-montserrat-alt-bold text-3xl mb-3">
              { back? t('screens.welcome.titleBack') : t('screens.welcome.title') }
            </Text>
            { children? children : defaultText }
          </View>
          <View >
            <View className="flex flex-row justify-center">
              <Pressable onPress={() => openExternalUrl('https://www.ledge.eu')}>
                <Info />
              </Pressable>
            </View>
            <Text
              className="text-center text-md text-gray-600 p-4"
              onPress={() => openExternalUrl('https://www.ledge.eu')}
              suppressHighlighting
            >
              { t('screens.welcome.info') }
            </Text>
          </View>
        </View>
        <View className="absolute bottom-24 left-0 right-0 px-7">
          <Button
            onPress={next}
            color="pink"
          >
            <Text className="text-pink-dark">
              { t('screens.welcome.next') }
            </Text>
          </Button>
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

export default WelcomeScreen;
