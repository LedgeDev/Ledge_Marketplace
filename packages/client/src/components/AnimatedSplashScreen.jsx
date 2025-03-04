import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

function AnimatedSplashScreen({ children, fontsLoaded, isNavigationReady }) {
  const animation = useMemo(() => new Animated.Value(1), []);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (fontsLoaded && imageLoaded && isNavigationReady) {
      runAnimationAndHide();
    }
  }, [fontsLoaded, imageLoaded, isNavigationReady]);

  const runAnimationAndHide = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      Animated.timing(animation, {
        toValue: 0,
        duration: 500, // Adjust duration as needed
        useNativeDriver: true,
      }).start(() => {
        setAnimationComplete(true);
      });
    } catch (e) {
      console.error(e);
    }
  }, [animation]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: Constants.expoConfig.splash.backgroundColor,
              opacity: animation,
            },
          ]}
        >
          <Image
            style={{
              width: "100%",
              height: "100%",
              resizeMode: Constants.expoConfig.splash.resizeMode || "cover",
            }}
            source={require('../assets/images/splash.png')}
            onLoadEnd={() => setImageLoaded(true)}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </View>
  );
}

export default AnimatedSplashScreen;
