import React, { useCallback, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import LoginView from './LoginView';
import OnboardingView from './OnboardingView';
import { useNavigation } from '@react-navigation/native';
import { getUser, resetUser, updateUserWelcomeSeen } from '../../store/models/users';
import { ActivityIndicator, View } from 'react-native';
import EventBus from 'react-native-event-bus';
import { useLedgeTransitions } from '../../hooks/useLedgeTransitions';
import { saveSeenIdsToAsyncStorage as forYouBadgeSave } from '../../store/models/brands';
import { saveSeenIdsToAsyncStorage as questionnaireBadgeSave } from '../../store/models/questionnaires';
import { saveSeenIdsToAsyncStorage as benefitsBadgeSave } from '../../store/models/benefits';
import { saveSeenIdsToAsyncStorage as postsBadgeSave } from '../../store/models/posts';
import { restoreSeenIdsFromAsyncStorage as forYouBadgeRestore } from '../../store/models/brands';
import { restoreSeenIdsFromAsyncStorage as questionnaireBadgeRestore } from '../../store/models/questionnaires';
import { restoreSeenIdsFromAsyncStorage as benefitsBadgeRestore } from '../../store/models/benefits';
import { restoreSeenIdsFromAsyncStorage as postsBadgeRestore } from '../../store/models/posts';
import WelcomeIntroView from './WelcomeIntroView';

const WelcomeScreen = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.users.data);
  const userStatus = useSelector((state) => state.users.status);
  const storedQuestionnaire = useSelector((state) => state.questionnaires.questionnaire);
  const [stage, setStage] = useState(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { splashTransitionTime } = useLedgeTransitions();

  // Add logging for state changes
  useEffect(() => {
    console.log('[DEBUG] WelcomeScreen - State:', {
      isAuthenticated,
      userStatus,
      stage,
      hasUser: !!user,
    });
  }, [isAuthenticated, userStatus, stage, user]);

  const determineStage = useCallback(() => {
    if (isAuthenticated === false) {
      console.log('[DEBUG] determineStage: login (isAuthenticated is false)');
      return 'login';
    } else if (!user) {
      console.log('[DEBUG] determineStage: loading (user is null/undefined)');
      return 'loading';
    } else {
      console.log('[DEBUG] determineStage: complete (user exists)');
      return 'complete';
    }
  }, [isAuthenticated, user]);

  // save/restore the badge indicators of all the sections where this is implemented
  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState === 'background') {
          await Promise.all([
            dispatch(forYouBadgeSave()).unwrap(),
            dispatch(questionnaireBadgeSave()).unwrap(),
            dispatch(benefitsBadgeSave()).unwrap(),
            dispatch(postsBadgeSave()).unwrap(),
          ]);
        }
      },
    );
    dispatch(forYouBadgeRestore());
    dispatch(questionnaireBadgeRestore());
    dispatch(benefitsBadgeRestore());
    dispatch(postsBadgeRestore());
    // Clean up the listener on unmount
    return () => {
      appStateListener.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[DEBUG] WelcomeScreen - useFocusEffect triggered', {
        isAuthenticated,
        userStatus,
        hasUser: !!user,
      });

      if (isAuthenticated === null) {
        console.log('[DEBUG] isAuthenticated is null, setting stage to login');
        setStage('login');
        return;
      }

      EventBus.getInstance().fireEvent("showButton", { value: false });

      if (isAuthenticated === false && user) {
        console.log('[DEBUG] Resetting user (isAuthenticated=false but user exists)');
        dispatch(resetUser());
        return;
      }
      if (isAuthenticated === true && !userStatus === 'loading' && !user) {
        console.log('[DEBUG] Getting user (isAuthenticated=true but no user)');
        dispatch(getUser());
        return;
      }
      const newStage = determineStage();
      console.log('[DEBUG] Setting stage to:', newStage);
      setStage(newStage);

      if (newStage !== 'loading') {
        console.log('[DEBUG] Hiding splash screen (stage is not loading)');
        EventBus.getInstance().fireEvent("hideSplashScreen");
      }

      if (newStage === 'complete') {
        console.log('[DEBUG] Stage is complete, preparing to navigate to Explore');
        if (user && !user.hasCompletedOnboarding) {
          console.log('[DEBUG] Updating user welcome seen');
          dispatch(updateUserWelcomeSeen());
        }
        console.log('[DEBUG] Navigating to Explore screen');
        navigation.replace('Explore', { hideSplashScreenOnLoad: true });
      }
    }, [isAuthenticated, user, dispatch, navigation, determineStage, userStatus]),
  );

  const handleGetStarted = () => {
    setStage('onboarding');
  };

  switch (stage) {
    case 'login':
      console.log('[DEBUG] Rendering LoginView');
      return <LoginView />;
    case 'welcome':
      console.log('[DEBUG] Rendering WelcomeIntroView');
      return <WelcomeIntroView onGetStarted={handleGetStarted} />;
    case 'loading':
      console.log('[DEBUG] Rendering loading indicator');
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#999999" />
        </View>
      );
    case 'onboarding':
      console.log('[DEBUG] Rendering OnboardingView');
      return (
        <OnboardingView
          onLoad={async () => {
            console.log('[DEBUG] OnboardingView onLoad triggered');
            EventBus.getInstance().fireEvent("hideSplashScreen");
            await new Promise((resolve) => setTimeout(resolve, splashTransitionTime));
          }}
        />
      );
    default:
      console.log('[DEBUG] Rendering default loading indicator, stage:', stage);
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#999999" />
        </View>
      );
  }
};

export default WelcomeScreen;
