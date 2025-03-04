import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { sendProductFeedback } from '../../store/models/answers';
import { fetchProductFeedbackQuestions } from '../../store/models/questions';
import { fetchMyFavourites } from '../../store/models/brands';
import ScreenWrapper from '../../components/ScreenWrapper';
import QuestionsIndex from '../../components/questions/QuestionsIndex';
import PendingBrandInteractionScreen from '../../components/intermediateScreens/PendingBrandInteractionScreen';
import ThankYouScreen from '../../components/intermediateScreens/ThankYouScreen';
import MenuHeader from '../../components/MenuHeader';
import { useTranslation } from '../../hooks/useTranslation';
import EventBus from 'react-native-event-bus';

function ProductFeedbackScreen({ route }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const brand = route.params?.brand;
  const [showWelcome, setShowWelcome] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const productFeedbackQuestions = useSelector((state) => state.questions.productFeedbackQuestions);
  const questionsStatus = useSelector((state) => state.questions.status);
  const currentAnswers = useRef({});
  const [questionsLoading, setQuestionsLoading] = useState(!productFeedbackQuestions);

  useEffect(() => {
    // fetch questions if not already fetched
    if (!productFeedbackQuestions && questionsStatus === 'idle') {
      setQuestionsLoading(true);
      dispatch(fetchProductFeedbackQuestions({}));
    } else if (questionsStatus === 'succeeded' || questionsStatus === 'failed') {
      setQuestionsLoading(false);
    }
  }, [questionsStatus, dispatch]);

  const postAnswers = useCallback(
    async (answers) => {
      const answersArray = Object.keys(answers).map((questionId) => {
        const q = productFeedbackQuestions.find((q) => q.id === questionId);
        return {
          questionId,
          classId: q.classId,
          answer: answers[questionId],
          questionText: q.question,
          productFeedbackBrandId: brand.id,
        };
      });
      setShowThankYou(true);
      setQuestionsLoading(true);
      await dispatch(sendProductFeedback(answersArray)).unwrap();
      // fetch favourites to update the interaction labels
      await dispatch(fetchMyFavourites()).unwrap();
      setQuestionsLoading(false);
    },
    [dispatch, navigation, productFeedbackQuestions],
  );

  const handleAnswerChange = (questionId, answer) => {
    if (!answer) return;
    currentAnswers.current = {
      ...currentAnswers.current,
      [questionId]: answer,
    };
  };

  const goToProfile = () => {
    navigation.replace('Brand Profile', { brand });
  };

  // hide card button when entering this screen
  useFocusEffect(
    useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: false });
      return () => {
        EventBus.getInstance().fireEvent("showButton", { value: true });
      };
    }, [])
  );

  if (showWelcome) {
    return (
      <PendingBrandInteractionScreen
        brand={brand}
        onNext={() => setShowWelcome(false)}
        onSkip={goToProfile}
        subtitleText={t('productFeedback.welcomeSubtitle')}
        nextText={t('productFeedback.nextButton')}
      />
    );
  }

  if (showThankYou) {
    return (
      <ThankYouScreen
        founder
        onFinished={goToProfile}
      />
    );
  }

  if (questionsLoading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#999999" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 flex px-7">
        <View className="h-full pb-16">
          <MenuHeader name={t('productFeedback.title')} />
          {!questionsLoading && (
            <QuestionsIndex
              questions={productFeedbackQuestions ? productFeedbackQuestions : []}
              onLastQuestionNext={postAnswers}
              onAnswerChange={handleAnswerChange}
              allowSkip
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

export default ProductFeedbackScreen;
