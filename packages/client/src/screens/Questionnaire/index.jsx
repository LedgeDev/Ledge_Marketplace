import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  LayoutAnimation,
  Text,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { createAnswer } from '../../store/models/answers';
import { getUser } from '../../store/models/users';
import ScreenWrapper from '../../components/ScreenWrapper';
import MenuHeader from '../../components/MenuHeader';
import QuestionsIndex from '../../components/questions/QuestionsIndex';
import WelcomeScreen from '../../components/intermediateScreens/WelcomeScreen';
import ThankYouScreen from '../../components/intermediateScreens/ThankYouScreen';
import { useTranslation } from '../../hooks/useTranslation';
import LevelAnimationScreen from '../../components/intermediateScreens/LevelAnimationScreen';
import EventBus from 'react-native-event-bus';

function QuestionnaireScreen({ route }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const subCategory = route.params?.subCategory;
  const orderedSubCategory = route.params?.orderedSubCategory;
  const welcome = route.params?.welcome;
  const menuHeader = route.params?.menuHeader;
  const [refreshing, setRefreshing] = useState(false);
  const [questionnaireLoading, setQuestionnaireLoading] = useState(!questionnaire);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [showMenuHeader, setShowMenuHeader] = useState(menuHeader ? true : false);
  const [levelAnimationOptions, setLevelAnimationOptions] = useState({ show: false, oldUser: {}, newUser: {} });
  const questionnaire = useSelector((state) => state.questionnaires.questionnaire);
  const questionnaireStatus = useSelector((state) => state.questionnaires.status);
  const user = useSelector((state) => state.users.data);
  const currentAnswers = useRef({});
  const [flowState, setFlowState] = useState(welcome ? 'welcome' : 'questions');
  const [dataSent, setDataSent] = useState(false);
  const [thankYouFinished, setThankYouFinished] = useState(false);

  // hide sidebar button when entering this screen
  useFocusEffect(
    useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: false });
      return () => {
        EventBus.getInstance().fireEvent("showButton", { value: true });
      };
    }, [])
  );

  useEffect(() => {
    // fetch questionnaire if not already fetched
    if (!questionnaire && questionnaireStatus === 'idle') {
      setQuestionnaireLoading(true);
    } else if (questionnaireStatus === 'succeeded' || questionnaireStatus === 'failed') {
      setQuestionnaireLoading(false);
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [questionnaireStatus, dispatch]);

  useEffect(() => {
    // only show questions that are not answered, and filter by subCategory if provided
    if (questionnaire?.questions) {
      const questions = questionnaire.questions.filter((q) => !q.answers.length);
      if (subCategory) {
        setFilteredQuestions(
          questions.filter((q) => q.questionnaireSubCategory === subCategory),
        );
        return;
      } else if (orderedSubCategory) {
        let subCategories = questions.map((q) => parseInt(q.questionnaireSubCategory));
        subCategories = subCategories.filter((sc) => !isNaN(sc));
        if (subCategories.length === 0) {
          setFilteredQuestions(questions);
          return;
        }
        const lowestSubCategory = Math.min(...subCategories);
        setFilteredQuestions(
          questions.filter((q) => parseInt(q.questionnaireSubCategory) === lowestSubCategory),
        );
        return;
      }
      setFilteredQuestions(questions);
    }
  }, [questionnaire]);

  useEffect(() => {
    if (dataSent && thankYouFinished) {
      if (levelAnimationOptions.show) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFlowState('levelAnimation');
      } else {
        handleGoBack();
      }
    }
  }, [dataSent, thankYouFinished, levelAnimationOptions.show]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleBackPress = async () => {
    if (Object.keys(currentAnswers.current).length > 0) {
      await postAnswers(currentAnswers.current, true);
    } else {
      handleGoBack();
    }
  };

  const postAnswers = useCallback(
    async (answers, quitOnFinished) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (quitOnFinished) {
        setQuestionnaireLoading(true);
      } else {
        setFlowState('thankYou');
      }
      const answersArray = Object.keys(answers).map((questionId) => {
        const q = questionnaire.questions.find((q) => q.id === questionId);
        return {
          questionId,
          classId: q.classId,
          answer: answers[questionId],
          questionText: q.question,
        };
      });
      await dispatch(createAnswer(answersArray)).unwrap();
      const oldUser = { ...user };
      const newUser = await dispatch(getUser({})).unwrap();
      if (oldUser.level.order !== newUser.level.order) {
        setLevelAnimationOptions({ show: true, oldUser, newUser });
      }
      setDataSent(true);
      if (quitOnFinished) {
        handleThankYouFinished();
      }
    },
    [dispatch, navigation, questionnaire, user],
  );


  const handleAnswerChange = (questionId, answer) => {
    if (!answer) return;
    currentAnswers.current = {
      ...currentAnswers.current,
      [questionId]: answer,
    };
  };

  const handleWelcomeNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFlowState('questions');
  };

  const handleThankYouFinished = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThankYouFinished(true);
  };

  if (flowState === 'welcome') {
    return (
      <WelcomeScreen
        onNext={handleWelcomeNext}
        onSkip={handleGoBack}
      />
    );
  } else if (flowState === 'thankYou') {
    return <ThankYouScreen founder onFinished={handleThankYouFinished} />;
  } else if (flowState === 'levelAnimation') {
    return (
      <LevelAnimationScreen
        oldUser={levelAnimationOptions.oldUser}
        newUser={levelAnimationOptions.newUser}
        onFinished={handleGoBack}
      />
    );
  } else if (flowState === 'questions') {
    return (
      <ScreenWrapper>
        <View className="flex-1 w-full h-full px-7 pb-14">
          {showMenuHeader ? (
            <MenuHeader
              name={
                questionnaire?.name ? questionnaire.name : t('questionnaire.title')
              }
              onBack={handleBackPress}
            />
          ) : (
            <Text className="font-montserrat-alt-bold text-pink mb-2 mt-6">
              {questionnaire?.name ? questionnaire.name : t('questionnaire.title')}
            </Text>
          )}
          {questionnaireLoading && (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#999999" />
            </View>
          )}
          {!questionnaireLoading && filteredQuestions && (
            <QuestionsIndex
              questions={filteredQuestions}
              onLastQuestionNext={postAnswers}
              onAnswerChange={handleAnswerChange}
              allowSkip
            />
          )}
        </View>
      </ScreenWrapper>
    );
  }
}

export default QuestionnaireScreen;
