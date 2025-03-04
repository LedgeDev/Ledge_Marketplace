import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, LayoutAnimation, Image, Text, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import ScreenWrapper from '../ScreenWrapper';
import ProgressPicture from '../ProgressPicture';
import { useTranslation } from '../../hooks/useTranslation';
import GiftVideo from '../../assets/video/advent-calendar-gift.mov';
import DontGiveUpVideo from '../../assets/video/advent-calendar-dontgiveup.mov';

function AdventCalendarAnimationScreen({ brand, didWin, onFinished = () => {} }) {
  const videoRef = useRef(null);
  const [state, setState] = useState('video');
  const [videoSource, setVideoSource] = useState(didWin ? GiftVideo : DontGiveUpVideo);
  const { t } = useTranslation();
  const videoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    }
  }, []);

  const handlePlaybackStatusUpdate = useCallback(({ didJustFinish }) => {
    if (didJustFinish) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setState('congratulations');
      setTimeout(() => {
        onFinished();
      }, 4000);
    }
  }, [onFinished]);

  if (state === 'video') {
    return (
      <View className="flex-1 w-full bg-black">
        <Animated.View className="flex-1 w-full" style={{ opacity: videoOpacity }}>
          <Video
            ref={videoRef}
            style={{ height: '100%', width: '100%' }}
            source={videoSource}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            shouldPlay
          />
        </Animated.View>
      </View>
    );
  } else if (state === 'congratulations') {
    return (
      <ScreenWrapper>
        <View
          className="flex-1 flex items-center justify-center gap-14 px-3"
        >
          {brand.founders && brand.founders.length > 0 && (
            <View className="relative w-[120] h-[120]">
              <ProgressPicture
                size={120}
                strokeWidth={7}
                progress={100}
                imageUrl={brand.founders[0].image}
              />
              <Image
                source={require('../../assets/images/advent-calendar-card-hat.png')}
                resizeMode="contain"
                className="absolute -top-[31] left-[26] w-[93%] h-[92%]"
              />
            </View>
          )}
          <View className="px-6">
            <Text className="text-center font-montserrat-alt-bold text-3xl mb-3">
              {didWin ? 
                t('myBrands.pitch.adventCalendar.didWin.title')
                : t('myBrands.pitch.adventCalendar.didNotWin.title')
              }
            </Text>
            <Text className="font-inter-light leading-6 text-center text-lg">
              {didWin ? 
                t('myBrands.pitch.adventCalendar.didWin.subtitle')
                : t('myBrands.pitch.adventCalendar.didNotWin.subtitle')
              }
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    )
  }
  return <View className="flex-1 w-full bg-black" />;
}

export default AdventCalendarAnimationScreen;