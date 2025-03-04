import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  LayoutAnimation,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { getInterestedCategories, poolRefill, getUser } from '../../store/models/users';
import { getForYouBrands } from '../../store/models/brands';
import ScreenWrapper from '../../components/ScreenWrapper';
import QuestionsIndex from '../../components/questions/QuestionsIndex';
import WelcomeScreen from '../../components/intermediateScreens/WelcomeScreen';
import ThankYouScreen from '../../components/intermediateScreens/ThankYouScreen';
import { setBoolInStorage } from '../../utils/check-bool-from-storage';
import { useTranslation } from '../../hooks/useTranslation';
import EventBus from 'react-native-event-bus';

function PoolRefillScreen({ route }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const welcome = route.params?.welcome;
  const showNoDataWarning = route.params?.showNoDataWarning;
  const [questionLoading, setQuestionLoading] = useState(true);
  const swipingQuestion = useSelector((state) => state.users.swipingQuestion);
  const [state, setState] = useState(welcome ? 'welcome' : '');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchInterestedCategories = async () => {
      const { interestedCategories } = await dispatch(getInterestedCategories()).unwrap();
      if (interestedCategories.length === 0) {
        if (showNoDataWarning) {
          EventBus.getInstance().fireEvent("showButton", { value: false });
          setState('noData');
          setBoolInStorage('poolNeedsRefill', false);
          setTimeout(() => navigation.goBack(), 3000);
        } else {
          setState('');
          setBoolInStorage('poolNeedsRefill', false);
          navigation.goBack();
        }
        return;
      }
      EventBus.getInstance().fireEvent("showButton", { value: false });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setState('swiping');
      setQuestionLoading(false);
    };
    fetchInterestedCategories();
  }, [dispatch]);

  const postAnswers = useCallback(
    async (answers) => {
      setState('finished');
      await setBoolInStorage('poolNeedsRefill', false);
      await dispatch(poolRefill({ answer: answers })).unwrap();
      await dispatch(getUser()).unwrap();
      await dispatch(getForYouBrands()).unwrap();
    },
    [dispatch, navigation],
  );

  useEffect(() => {
    if (state === 'finished') {
      setTimeout(() => {
        EventBus.getInstance().fireEvent("showButton", { value: true });
        navigation.goBack();
      }, 4000);
    }
  }, [state, navigation]);

  const handleAnswerChange = (questionId, answer) => {
    // if all answers are filled, post them
    if (!Object.keys(answer).some((key) => answer[key].answer === null)) {
      postAnswers(answer);
    }
  }

  const handleGoSwiping = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState('swiping');
  }

  if (state === 'welcome') {
    return (
      <WelcomeScreen
        onNext={handleGoSwiping}
        onSkip={() => navigation.goBack()}
      />
    );
  }

  if (state === 'finished') {
    return <ThankYouScreen />;
  }

  if (state === 'swiping') {
    return (
      <ScreenWrapper>
        <View className="flex-1 flex px-7">
          <View
            className="h-full pb-16"
          >
            {questionLoading || (!swipingQuestion) && (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#999999" />
              </View>
            )}
            {!questionLoading && swipingQuestion && (
              <View className="flex-1 pt-10">
                <QuestionsIndex
                  questions={[swipingQuestion]}
                  onAnswerChange={handleAnswerChange}
                  hideProgressBar
                  isOnboarding
                  buttonRowType="none"
                />
              </View>
            )}
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (state === 'noData') {
    return (
      <ScreenWrapper>
        <View className="flex-1 w-full justify-center items-center px-12 gap-6">
          <Text className="text-2xl font-montserrat-alt text-blue text-center">
            {t('poolRefil.noMoreTitle')}
          </Text>
          <Text className="text-xl font-inter text-blue text-center">
            {t('poolRefil.noMoreSubtitle')}
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <View className="flex-1 w-full bg-transparent" />
  )
}

export default PoolRefillScreen;
