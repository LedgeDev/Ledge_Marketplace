import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Pressable, Image } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import ScreenWrapper from '../ScreenWrapper';
import { useExternalUrl } from '../../hooks/useExternalUrl';
import Document from '../../assets/svg/document.svg';
import Info from '../../assets/svg/info.svg';

function ThankYouScreen({ founder = false, onFinished = () => {}, animationTime = 3000 }) {
  const { t } = useTranslation();
  const { openExternalUrl } = useExternalUrl();
  const [founderListLength, setFounderListLength] = useState(0);
  const founderList = useRef(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const founderInitialTranslateX = 200;
  const founderTranslateX = useRef(new Animated.Value(founderInitialTranslateX)).current;
  const founderOpacity = useRef(new Animated.Value(0)).current;
  const loadingTop = useRef(new Animated.Value(-50)).current;
  const fadeOutTime = 300;
  const [randomImages, setRandomImages] = useState([]);

  // image imports must be explicit since they are required to be included in the bundle
  // and cannot be dynamically imported
  const founderImages = [
    require('../../assets/images/founderImages/f1.jpg'),
    require('../../assets/images/founderImages/f2.jpg'),
    require('../../assets/images/founderImages/f3.jpg'),
    require('../../assets/images/founderImages/f4.jpg'),
    require('../../assets/images/founderImages/f5.jpg'),
    require('../../assets/images/founderImages/f6.jpg'),
    require('../../assets/images/founderImages/f7.jpg'),
    require('../../assets/images/founderImages/f8.jpg'),
    require('../../assets/images/founderImages/f9.jpg'),
    require('../../assets/images/founderImages/f10.jpg'),
    require('../../assets/images/founderImages/f11.jpg'),
    require('../../assets/images/founderImages/f12.jpg'),
    require('../../assets/images/founderImages/f13.jpg'),
    require('../../assets/images/founderImages/f14.jpg'),
    require('../../assets/images/founderImages/f15.jpg'),
    require('../../assets/images/founderImages/f16.jpg'),
    require('../../assets/images/founderImages/f17.jpg'),
    require('../../assets/images/founderImages/f18.jpg'),
  ]
  useEffect(() => {
    setRandomImages(founderImages.sort(() => 0.5 - Math.random()).slice(0, 8));
  }, [])

  useEffect(() => {
    if (founder) {
      // When founder is true, run the parallel animation that calls onFinished
      if (founderListLength) {
        Animated.parallel([
          Animated.timing(founderOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(founderTranslateX, {
            toValue: founderInitialTranslateX - (founderListLength - 40),
            duration: 6000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onFinished();
        });
      }
    } else {
      // If founder is false, simply trigger onFinished after animationTime milliseconds
      const timer = setTimeout(() => {
        onFinished();
      }, animationTime);
      return () => clearTimeout(timer);
    }
  }, [founder, founderListLength, animationTime, onFinished]);

  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: fadeOutTime,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScreenWrapper>
      <Animated.View
        className="flex-1 flex justify-center items-center px-7"
        style={{ opacity: screenOpacity }}
      >
        <View className="flex justify-center items-center gap-16">
          <View>
            <Text className="text-center font-montserrat-alt-bold text-3xl mb-3">
              { t('screens.thankYou.title') }
            </Text>
            <Text className="text-center text-md px-9">
              { founder ? t('screens.thankYou.subtitleFounder') : t('screens.thankYou.subtitle') }
            </Text>
          </View>
          { founder && (
            <View >
              <View className="mx-auto">
                <Document />
              </View>
              {/* vertical loading */}
              <View className='relative w-1.5 h-20 rounded-full bg-pink-light mx-auto my-3 overflow-hidden'>
                <Animated.View
                  className="w-full h-5 rounded-full bg-pink"
                  style={{ top: loadingTop }}
                >
                </Animated.View>
              </View>
              <Animated.View
                ref={founderList}
                className="h-16 flex flex-row gap-4"
                style={{ transform: [{ translateX: founderTranslateX }], opacity: founderOpacity }}
                onLayout={(event) => {
                  const {width} = event.nativeEvent.layout;
                  setFounderListLength(width);
                }}
              >
                {randomImages?.length > 0 && randomImages.map((item, index) => (
                  <Image
                    key={index}
                    source={item}
                    className="w-12 h-12 rounded-full"
                  />
                ))}
              </Animated.View>
            </View>
          )}
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

export default ThankYouScreen;
