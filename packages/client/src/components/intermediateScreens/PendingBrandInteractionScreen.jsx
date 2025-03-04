import React, { useRef, useCallback } from 'react';
import { View, Text, Animated } from 'react-native';
import ExtImage from '../ExtImage';
import { useTranslation } from '../../hooks/useTranslation';
import ScreenWrapper from '../ScreenWrapper';
import Button from '../../components/Button';
import ArrowRight from '../../assets/svg/arrow-right-pink-2.svg';

function PendingBrandInteractionScreen({
  onNext = () => {},
  onSkip = () => {},
  nextText,
  skipText,
  subtitleText,
  brand,
  children,
}) {
  const { t } = useTranslation();
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const fadeOutTime = 300;

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
        className="relative flex-1 flex justify-center gap-20 px-10"
        style={{ opacity: screenOpacity }}
      >
        <View className="absolute top-10 right-0 px-7 flex flex-row justify-end">
          <Button
            appendIcon={<ArrowRight />}
            color="gray"
            onPress={skip}
          >
            <Text className="text-pink-dark">
              {skipText ? skipText : t('screens.pendingInteraction.skip')}
            </Text>
          </Button>
        </View>
        <View className="flex justify-center items-center gap-8">
          {brand?.founders?.length > 0 && (
            <ExtImage
              mediaSource={brand.founders[0].image}
              className="w-64 h-64 rounded-full"
            />
          )}
          <View className="px-6">
            <Text className="text-center font-montserrat-alt text-3xl mb-3">
              {t('screens.pendingInteraction.title')}
            </Text>
            {children ? (
              children
            ) : (
              <Text className="font-montserrat-alt text-center text-md">
                {subtitleText ? subtitleText : t('screens.pendingInteraction.subtitle')}
              </Text>
            )}
          </View>
        </View>
        <View>
          <Button onPress={next} color="gray" big>
            <Text className="text-pink-dark font-bold">
              {nextText ? nextText : t('screens.pendingInteraction.next')}
            </Text>
          </Button>
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

export default PendingBrandInteractionScreen;
