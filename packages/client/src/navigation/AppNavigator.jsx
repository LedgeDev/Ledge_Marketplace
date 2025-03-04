import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { NAVIGATE } from '../store/navigationActions';
import { navigationRef } from './navigationService';

// Import your screens
import WelcomeScreen from '../screens/Welcome';
import ExploreScreen from '../screens/Explore';
import MyBrandsScreen from '../screens/MyBrands';
import SettingsScreen from '../screens/Settings';
import HelpUsGetBetterScreen from '../screens/HelpUsGetBetter';
import WarningScreen from '../screens/Warning';
import MyDataScreen from '../screens/MyData';
import BrandProfile from '../screens/MyBrands/brandProfile';
import AnswersScreen from '../screens/Answers';
import QuestionnaireScreen from '../screens/Questionnaire';
import PitchScreen from '../screens/Pitch';
import LetsTalkScreen from '../screens/LetsTalk';
import PoolRefillScreen from '../screens/PoolRefill';
import ProductFeedbackScreen from '../screens/ProductFeedback';

const Stack = createStackNavigator();

function AppNavigator({ onRouteChange }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (navigationRef.isReady()) {
      const updateState = () => {
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        const currentParams = navigationRef.getCurrentRoute()?.params;

        onRouteChange(currentRouteName);

        if (currentRouteName) {
          dispatch({
            type: NAVIGATE,
            payload: {
              routeName: currentRouteName,
              params: currentParams
            },
          });
        }
      };

      updateState();

      const unsubscribe = navigationRef.addListener('state', updateState);
      return () => {
        unsubscribe();
      };
    }
  }, [dispatch, onRouteChange]);

  const forFade = ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyleInterpolator: ({ current }) => {
          const translateX = current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [400, 0],
          });

          return {
            cardStyle: {
              transform: [{ translateX }],
            },
          };
        },
      }}
    >
      {/* navbar screens */}
      <Stack.Group
        screenOptions={{
          cardStyleInterpolator: forFade,
        }}
      >
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="My Brands" component={MyBrandsScreen} />
        <Stack.Screen name="My Data" component={MyDataScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="LetsTalk" component={LetsTalkScreen} />
        <Stack.Screen name="Pool Refill" component={PoolRefillScreen} />
        <Stack.Screen name="Pitch" component={PitchScreen} />
      </Stack.Group>
      <Stack.Screen name="Help Us" component={HelpUsGetBetterScreen} />
      <Stack.Screen name="Warning" component={WarningScreen} />
      <Stack.Screen name="Brand Profile" component={BrandProfile} />
      <Stack.Screen name="Answers" component={AnswersScreen} />
      <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Product Feedback" component={ProductFeedbackScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
