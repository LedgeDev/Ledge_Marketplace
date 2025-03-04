import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { USE_AUTH0_API } from '@env';
import { useLedgeTransitions } from '../../hooks/useLedgeTransitions';
import ScreenWrapper from '../../components/ScreenWrapper';
import LoginAnimationScreen from './LoginAnimationScreen';
import MobileLogin from './MobileLogin';
import Auth0Login from './Auth0Login';
import { checkBoolFromStorage } from '../../utils/check-bool-from-storage';

function LoginView() {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const translateYAnimation = useRef(new Animated.Value(0)).current;
  const translateYLogin = useRef(new Animated.Value(windowHeight)).current;
  const screensGap = 0;
  const animationTime = 700;
  const { easeOut } = useLedgeTransitions();

  useEffect(() => {
    const runAnimation = async () => {
      const hasSeenAnimation = await checkBoolFromStorage('hasSeenLoginAnimation');
      if (hasSeenAnimation) {
        // only animate the login screen
        Animated.timing(translateYLogin, {
          toValue: 0,
          duration: animationTime,
          useNativeDriver: true,
          easing: easeOut,
        }).start();
      } else {
        setTimeout(() => {
          Animated.timing(translateYAnimation, {
            toValue: -windowHeight - screensGap,
            duration: animationTime,
            useNativeDriver: true,
            easing: easeOut,
          }).start();
          Animated.timing(translateYLogin, {
            toValue: 0,
            duration: animationTime,
            useNativeDriver: true,
            easing: easeOut,
          }).start();
        }, 8000);
      }
    }
    runAnimation();
  }, []);

  if (USE_AUTH0_API === 'true') {
    return (
      <ScreenWrapper>
        <Auth0Login />
      </ScreenWrapper>
    );
  }

  return (
    <View class="relative">
      <Animated.View
        style={{ 
          position: 'absolute',
          width: windowWidth,
          height: windowHeight,
          transform: [{ translateY: translateYAnimation }],
          overflow: 'hidden'
        }}
      >
        <LoginAnimationScreen />
      </Animated.View>
      <Animated.View
        style={{ 
          position: 'absolute',
          width: windowWidth,
          height: windowHeight,
          transform: [{ translateY: translateYLogin }],
          overflow: 'hidden'
        }}
      >
        <MobileLogin />
      </Animated.View>
    </View>
  );
}

export default LoginView;
