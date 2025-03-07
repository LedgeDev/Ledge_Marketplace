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
      return 'login';
    } else if (!user) {
      return 'loading';
    } else if (!user.hasCompletedOnboarding) {
      return 'welcome';
    } else {
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
      if (isAuthenticated === null) {
        setStage('login');
        return;
      }

      EventBus.getInstance().fireEvent("showButton", { value: false });

      if (isAuthenticated === false && user) {
        dispatch(resetUser());
        return;
      }
      if (isAuthenticated === true && !userStatus === 'loading' && !user) {
        dispatch(getUser());
        return;
      }
      const newStage = determineStage();
      setStage(newStage);

      if (newStage !== 'loading') {
        EventBus.getInstance().fireEvent("hideSplashScreen");
      }

      if (newStage === 'complete') {
        if (user && !user.hasCompletedOnboarding) {
          dispatch(updateUserWelcomeSeen());
        }
        navigation.replace('Explore', { hideSplashScreenOnLoad: true });
      }
    }, [isAuthenticated, user, dispatch, navigation, determineStage, userStatus]),
  );

  const handleGetStarted = () => {
    setStage('onboarding');
  };

  switch (stage) {
    case 'login':
      return <LoginView />;
    case 'welcome':
      return <WelcomeIntroView onGetStarted={handleGetStarted} />;
    case 'loading':
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#999999" />
        </View>
      );
    case 'onboarding':
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
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#999999" />
        </View>
      );
  }
};

export default WelcomeScreen;
