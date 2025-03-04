import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { Dimensions, View, AppState, Platform, UIManager, Keyboard } from 'react-native';
import Animated, { useSharedValue, interpolate, useAnimatedStyle, Easing, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from './src/store';
import { Auth0Provider } from 'react-native-auth0';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Navbar from './src/navigation/Navbar';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, POSTHOG_API_KEY } from '@env';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { navigationRef } from './src/navigation/navigationService';
import './src/assets/css/global.css';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import IntlWrapper from './intl';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import StoreAppWrapper from './src/components/StoreAppWrapper';
import { checkFirstOpenOfDay, setFirstOpenOfDay } from './src/utils/first-open';
import { checkDaysOpened, addDaysOpened } from './src/utils/days-opened';
import { checkQuestionnaireAvailable } from './src/utils/questionnaire-available';
import { peekBoolFromStorage } from './src/utils/check-bool-from-storage';
import ErrorOverlay from './src/components/ErrorOverlay';
import { PostHogProvider } from 'posthog-react-native';
import { fetchBrandAndRemoveFromDeletedBrands } from './src/store/models/brands';

// Initially prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// get screen width
const screenWidth = Dimensions.get('window').width;
const drawerWidth = screenWidth * 0.65;

const setNavigarionBarStyle = () => {
  if (Platform.OS === 'android') {
    // enables edge-to-edge mode
    NavigationBar.setPositionAsync('absolute')
    // transparent backgrounds to see through
    NavigationBar.setBackgroundColorAsync('#ffffff00')
    // changes the color of the button icons "dark||light"
    NavigationBar.setButtonStyleAsync("dark");
  }
}
setNavigarionBarStyle();

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const App = () => {
  const slideAnim = useSharedValue(drawerWidth);
  const [currentRoute, setCurrentRoute] = useState('Welcome');
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [welcomeFinished, setWelcomeFinished] = useState(currentRoute !== 'Welcome');
  const [deepLinkPending, setDeepLinkPending] = useState(null);
  const prevAppState = useRef(null);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'MontserratAlternates-Regular': require('./src/assets/fonts/MontserratAlternates-Regular.ttf'),
        'MontserratAlternates-Bold': require('./src/assets/fonts/MontserratAlternates-Bold.ttf'),
        'MontserratAlternates-SemiBold': require('./src/assets/fonts/MontserratAlternates-SemiBold.ttf'),
        'MontserratAlternates-ExtraLight': require('./src/assets/fonts/MontserratAlternates-ExtraLight.ttf'),
        'Montserrat-Medium': require('./src/assets/fonts/Montserrat-Medium.ttf'),
        'Montserrat-Bold': require('./src/assets/fonts/Montserrat-Bold.ttf'),
        'Inter-Medium': require('./src/assets/fonts/Inter-Medium.ttf'),
        'Inter-Light': require('./src/assets/fonts/Inter-Light.ttf'),
        'Inter-Thin': require('./src/assets/fonts/Inter-Thin.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  useEffect(() => {
    if (currentRoute !== 'Welcome' && !welcomeFinished) {
      setWelcomeFinished(true);
    }
  }, [currentRoute]);

  // Handle pending deep links once navigation is ready
  useEffect(() => {
    if (isNavigationReady && deepLinkPending) {
      const handlePendingDeepLink = async () => {
        const parsedUrl = Linking.parse(deepLinkPending);

        if (parsedUrl.hostname === 'brand' && parsedUrl.path) {
          const brandId = parsedUrl.path;

          try {
            const brand = await store.dispatch(fetchBrandAndRemoveFromDeletedBrands(brandId)).unwrap();

            if (!brand) {
              console.warn(`Brand with ID ${brandId} not found`);
              return;
            }

            setTimeout(() => {
              navigationRef.current?.navigate('Brand Profile', {
                brand: brand,
                measureScreenTime: true
              });
            }, 2000);

          } catch (error) {
            console.error('Error going to brand profile:', error);
          }
        }

        setDeepLinkPending(null);
      };

      handlePendingDeepLink();
    }
  }, [isNavigationReady, deepLinkPending]);

  // manage navigation bar on keyboard closed
  useEffect(() => {
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setNavigarionBarStyle();
    });

    return () => {
      hideSubscription.remove();
    };
  }, []);

  // Check if it's the first open of the day and show random questions
  useEffect(() => {
    if (!isNavigationReady
        || currentRoute === 'Questionnaire'
        || currentRoute === 'Pool Refill'
        || !welcomeFinished
        || navigationRef.current === null
      ) {
      return;
    }

    const checkShowQuestionnaire = async () => {
      const firstOpen = await checkFirstOpenOfDay();
      const questionnaireAvailable = await checkQuestionnaireAvailable();
      setFirstOpenOfDay();
      if (firstOpen) {
        await addDaysOpened();
      }
      const daysOpened = await checkDaysOpened();

      if (
        firstOpen
        && daysOpened > 2
        && daysOpened % 3 === 0
        && questionnaireAvailable
        && navigationRef.current
      ) {
        navigationRef.current.navigate('Questionnaire', { orderedSubCategory: true, welcome: true, menuHeader: false });
      }
    };

    const checkShowPoolRefill = async () => {
      const show = await peekBoolFromStorage('poolNeedsRefill');
      if (show && navigationRef.current) {
        navigationRef.current.navigate('Pool Refill');
      }
    };

    checkShowQuestionnaire();
    checkShowPoolRefill();

    const appStateListener = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active' && prevAppState.current === 'background') {
          checkShowQuestionnaire();
          checkShowPoolRefill();
        }
        prevAppState.current = nextAppState;
      },
    );

    return () => {
      appStateListener.remove();
    };
  }, [peekBoolFromStorage, addDaysOpened, checkDaysOpened, checkFirstOpenOfDay, checkQuestionnaireAvailable, isNavigationReady, navigationRef, welcomeFinished]);

  const handleContentPress = () => {
    if (isNavbarVisible) {
      setIsNavbarVisible(false);
    }
  };

  const handleDeepLink = async (url) => {
    try {
      // If navigation isn't ready, store the URL for later
      if (!isNavigationReady) {
        setDeepLinkPending(url);
        return null;
      }

      // If navigation is ready, process the deep link immediately
      return await processDeepLink(url);
    } catch (error) {
      console.error('Error processing deep link:', error);
      return null;
    }
  };

  const processDeepLink = async (url) => {

    const parsedUrl = Linking.parse(url);

    if (parsedUrl.hostname === 'brand' && parsedUrl.path) {
      const brandId = parsedUrl.path;

      try {
        const brand = await store.dispatch(fetchBrandAndRemoveFromDeletedBrands(brandId)).unwrap();

        if (!brand) {
          console.warn(`Brand with ID ${brandId} not found`);
          return null;
        }

        navigationRef.current?.navigate('Brand Profile', {
          brand: brand,
          measureScreenTime: true
        });

        return null;
      } catch (error) {
        console.error('Error going to brand profile:', error);
        navigationRef.current?.navigate('Explore');
        return null;
      }
    }
    return url;
  };

  const linking = {
    prefixes: [
      'ledge://',
      'exp://',
      'https://ledge.eu',
      'https://www.ledge.eu'
    ],
    config: {
      screens: {
        'Brand Profile': 'brand/:id', // Simplified path configuration
      },
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url) {
        return handleDeepLink(url);
      }
      return url;
    },
    subscribe(listener) {
      const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
        await handleDeepLink(url);
      });

      return () => {
        linkingSubscription.remove();
      };
    },
  };

  useEffect(() => {
    slideAnim.value = isNavbarVisible ? 0 : drawerWidth;
  }, [isNavbarVisible]);

  const scaleAndTransformAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(interpolate(slideAnim.value, [0, drawerWidth], [-drawerWidth + 25, 0]), { duration: 250, easing: Easing.out(Easing.quad) }) },
      { scale: withTiming(interpolate(slideAnim.value, [0, drawerWidth], [0.75, 1]), { duration: 250, easing: Easing.out(Easing.quad) }) },
    ],
  }));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AnimatedSplashScreen fontsLoaded={fontsLoaded} isNavigationReady={isNavigationReady}>
      <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
        <Provider store={store}>
          <StoreAppWrapper>
            <SafeAreaProvider>
              <IntlWrapper>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <NavigationContainer
                    linking={linking}
                    ref={navigationRef}
                    onReady={() => setIsNavigationReady(true)}
                    theme={{
                      ...DefaultTheme,
                      colors: {
                        ...DefaultTheme.colors,
                        background: 'transparent',
                      },
                    }}
                  >
                    <PostHogProvider
                      apiKey={POSTHOG_API_KEY}
                      options={{
                        host: 'https://eu.i.posthog.com',
                        autocapture: {
                          captureTouches: true,
                          captureLifecycleEvents: true,
                          captureScreens: true,
                        },
                        person_profiles: 'always',
                        ip: false,
                      }}
                    >
                      <Navbar
                        // onSlide={handleNavbarSlide}
                        isNavbarVisible={isNavbarVisible}
                        setIsNavbarVisibleParent={setIsNavbarVisible}
                        currentRoute={currentRoute}
                      />
                      <View style={{ flex: 1 }} onTouchStart={handleContentPress}>
                        <Animated.View
                          className="flex-1"
                          style={[scaleAndTransformAnimatedStyle]}
                        >
                          <AppNavigator onRouteChange={setCurrentRoute} />
                          <ErrorOverlay />
                        </Animated.View>
                      </View>
                      <StatusBar style="auto" />
                    </PostHogProvider>
                  </NavigationContainer>
                </GestureHandlerRootView>
              </IntlWrapper>
            </SafeAreaProvider>
          </StoreAppWrapper>
        </Provider>
      </Auth0Provider>
    </AnimatedSplashScreen>
  );
};

export default App;
