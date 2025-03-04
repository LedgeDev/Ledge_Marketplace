import React, { useRef, useEffect } from 'react';
import { View, Image, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../hooks/useTranslation';
import LogoPink from '../../assets/logos/logo_pink.png';
import ZachAndVali from '../../assets/images/zach-and-vali.png';
import BrandRow1 from '../../assets/images/brand-row-1.png';
import BrandRow2 from '../../assets/images/brand-row-2.png';
import BrandRow3 from '../../assets/images/brand-row-3.png';

function LoginAnimationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const animationTime = 600;
  const initialTranslateYFounders = windowHeight;
  const opacityLogo = useRef(new Animated.Value(1)).current;
  const translateYFounders = useRef(new Animated.Value(initialTranslateYFounders)).current;
  const translateXFounderName1 = useRef(new Animated.Value(-1 * windowWidth)).current;
  const translateXFounderName2 = useRef(new Animated.Value(windowWidth)).current;
  const opacityNamesAnd = useRef(new Animated.Value(0)).current;
  const translateYWelcomeTo = useRef(new Animated.Value(-1 * windowHeight)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const translateYDiscover = useRef(new Animated.Value(-1 * windowHeight)).current;
  const opacityCardSubtitle = useRef(new Animated.Value(0)).current;
  const translateXScreen = useRef(new Animated.Value(0)).current;
  const translateXCardSubtitle = useRef(new Animated.Value(0)).current;
  const translateXYPictureRow1 = useRef(new Animated.ValueXY({ x: 700, y: 0 })).current;
  const translateXYPictureRow2 = useRef(new Animated.ValueXY({ x: -1500, y: 0 })).current;
  const translateXYPictureRow3 = useRef(new Animated.ValueXY({ x: 700, y: 0 })).current;
  // brand row images are placed originally (in the view) in the final position.
  // these values in the refs represent the initial translated position. Then, the animation move those values to 0, 0.


  const firstStepAnimations = [
    Animated.timing(opacityLogo, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.timing(translateYFounders, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
  ];

  const secondStepAnimations = [
    Animated.timing(translateXFounderName1, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.timing(translateXFounderName2, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.timing(opacityNamesAnd, {
      toValue: 1,
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.timing(translateYWelcomeTo, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
  ];

  const thirdStepAnimations = [
    Animated.timing(screenScale, {
      toValue: 0.4,
      duration: animationTime,
      useNativeDriver: true
    }),
  ];

  const fourthStepAnimations = [
    Animated.timing(translateYDiscover, {
      toValue: 0,
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.timing(opacityCardSubtitle, {
      toValue: 1,
      duration: animationTime,
      useNativeDriver: true
    }),
  ];

  const fifthStepAnimations = [
    Animated.timing(translateXScreen, {
      toValue: -1 * windowWidth * 2.5,
      duration: animationTime / 3,
      useNativeDriver: true
    }),
    Animated.timing(translateXCardSubtitle, {
      toValue: -1 * windowWidth,
      duration: animationTime / 3,
      useNativeDriver: true
    }),
    Animated.spring(translateXYPictureRow1, {
      toValue: { x: 0, y: 0 },
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.spring(translateXYPictureRow2, {
      toValue: { x: 0, y: 0 },
      duration: animationTime,
      useNativeDriver: true
    }),
    Animated.spring(translateXYPictureRow3, {
      toValue: { x: 0, y: 0 },
      duration: animationTime,
      useNativeDriver: true
    }),
  ];


  useEffect(() => {
    // execute animations with 1.5 seconds of delay between each step
    Animated.stagger(1500, [
      Animated.parallel(firstStepAnimations),
      Animated.parallel(secondStepAnimations),
      Animated.parallel(thirdStepAnimations),
      Animated.parallel(fourthStepAnimations),
      Animated.parallel(fifthStepAnimations),
    ]).start();
  }, []);

  return (
    <View 
      className="bg-cream"
      style={{ paddingTop: insets.top, width: windowWidth, height: windowHeight }}
    >
      <View
        className="relative flex-1 flex h-full w-80p bg-cream items-center"
        style={{ width: windowWidth, height: windowHeight }}
      >
        {/* Discover new brands */}
        <Animated.View
          className="absolute top-[70] left-0 right-0 flex justify-center items-center"
          style={{ transform: [{ translateY: translateYDiscover }] }}
        >
          <Text className="font-montserrat-alt-bold text-2xl">Discover new</Text>
          <Text className="font-montserrat-alt-bold text-5xl text-pink">Brands</Text>
        </Animated.View>
        {/* container with items of step X */}
        <View className="absolute top-0 bottom-0 left-0 right-0 shadow-sm">
          <Animated.View
            className={`absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center bg-cream ${ screenScale !== 1 ? 'rounded-4xl overflow-hidden shadow-none' : '' }`}
            style={{ transform: [{ scale: screenScale }, { translateX: translateXScreen }] }}
          >
            {/* founders image */}
            <Animated.Image
              source={ZachAndVali}
              resizeMode={'contain'}
              className="absolute z-0 w-full"
              style={{ transform: [{ translateY: translateYFounders }, { translateX: -20 }, { scale: 1.65 }] }}
            />
            {/* names */}
            <View className="absolute z-10 top-[270]">
              <View className="flex flex-row">
                <Animated.Text
                  className="font-montserrat-alt-bold text-2xl"
                  style={{ transform: [{ translateX: translateXFounderName1 }] }}
                >
                  Vali
                </Animated.Text>
                <Animated.Text
                  className="text-pink font-montserrat-alt-bold text-2xl"
                  style={{ opacity: opacityNamesAnd }}
                >
                  { ' &' }
                </Animated.Text>
              </View>
              <Animated.Text
                className="font-montserrat-alt-bold text-2xl pl-8"
                style={{ transform: [{ translateX: translateXFounderName2 }] }}
              >
                Zachi
              </Animated.Text>
            </View>
            {/* welcome to ledge */}
            <Animated.View
              className="absolute z-10 top-[70]"
              style={{ transform: [{ translateY: translateYWelcomeTo }] }}
            >
              <Text className="font-montserrat-alt-bold text-3xl text-center">
                Welcome to
              </Text>
              <Image
                source={LogoPink}
                resizeMode={'contain'}
                className="w-80 h-28"
              />
            </Animated.View>
          </Animated.View>
          {/* Card subtitle */}
          <Animated.View
            className="absolute top-[72%] left-[31%] z-10 w-44"
            style={{ opacity: opacityCardSubtitle, transform: [{ translateX: translateXCardSubtitle }] }}
          >
            <Text className="font-montserrat-alt-bold">ledge</Text>
            <Text className="text-gray-600">Zachi & Vali</Text>
          </Animated.View>
        </View>
        {/* picture rows */}
        <Animated.Image
          className="absolute top-[170] left-[-200] h-[300] w-[1012] overflow-visible flex flex-row items-center"
          resizeMode={'contain'}
          source={BrandRow1}
          style={{ transform: [{ translateX: translateXYPictureRow1.x }, { translateY: translateXYPictureRow1.y }] }}
        />
        <Animated.Image
          className="absolute top-[400] left-[-140] h-[300] w-[1012] overflow-visible flex flex-row items-center"
          resizeMode={'contain'}
          source={BrandRow2}
          style={{ transform: [{ translateX: translateXYPictureRow2.x }, { translateY: translateXYPictureRow2.y }] }}
        />
        <Animated.Image
          className="absolute top-[630] left-[-220] h-[300] w-[1012] overflow-visible flex flex-row items-center"
          resizeMode={'contain'}
          source={BrandRow3}
          style={{ transform: [{ translateX: translateXYPictureRow3.x }, { translateY: translateXYPictureRow3.y }] }}
        />
      </View>
    </View>
  );
}

export default LoginAnimationScreen;