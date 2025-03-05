import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, LayoutAnimation, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { patchAnswer, findSortedAnswers, createAnswer } from '../../store/models/answers';
import { getUser } from '../../store/models/users';
import ScreenWrapper from '../../components/ScreenWrapper';
import QuestionsIndex from '../../components/questions/QuestionsIndex';
import MenuList from '../../components/MenuList';
import MenuHeader from '../../components/MenuHeader';
import BottomSheet from '../../components/BottomSheet';
import Button from '../../components/Button';
import LevelAnimationScreen from '../../components/intermediateScreens/LevelAnimationScreen';
import { useTranslation } from '../../hooks/useTranslation';
import EventBus from 'react-native-event-bus';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from '../../hooks/useAnalytics';

function Answers({ navigation, route }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.users.data);
  const answers = useSelector(state => state.answers.answers);
  const answersStatus = useSelector(state => state.answers.status);
  const answersError = useSelector(state => state.answers.error);
  const [currentAnswer, setCurrentAnswer] = useState(false);
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [levelAnimationOptions, setLevelAnimationOptions] = useState({ show: false, oldUser: {}, newUser: {} });
  const bottomSheetModalRef = useRef(null);
  const { id, sort, menuName } = route.params;
  const { t, locale } = useTranslation();
  let userAnswers = [];
  let pendingQuestions = [];
  const analytics = useAnalytics()


  useFocusEffect(
    React.useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: false });
      return () => {
        EventBus.getInstance().fireEvent("showButton", { value: true });
      };
    }, [])
  );

  useEffect(() => {
    // set userAnswers and pendingQuestions
    if (!answers) return;
    if (sort === 'questionClass') {
      const questionClass = answers?.questionClass?.find(questionClass => questionClass.id === id);
      userAnswers = questionClass?.answers;
      pendingQuestions = questionClass?.pendingQuestions;
    } else if (sort === 'questionnaire') {
      const questionnaire = answers?.questionnaire?.find(questionnaire => questionnaire.id === id);
      userAnswers = questionnaire?.answers;
      pendingQuestions = questionnaire?.pendingQuestions;
    }
    // set items and new items
    setItems(userAnswers? userAnswers.map((answer, index) => ({
      item: answer,
      text: answer.questionText?.[locale],
      onPress: () => showAnswer(answer),
      locked: false,
      new: false,
    })) : []);

    setNewItems(pendingQuestions ? pendingQuestions.map((question, index) => ({
      item: question,
      text: question.question[locale],
      onPress: () => showAnswer({ question: question, answer: null }),
      locked: false,
      new: true,
    })) : []);
  }, [answers]);

  // snap points for bottom sheet
  const snapPoints = useMemo(() => ['25%', '80%'], []);

  // callbacks for bottom sheet
  const showAnswer = useCallback(async (answer) => {
    setCurrentAnswer(answer);
    await bottomSheetModalRef.current?.show();
  }, []);

  const patchCurrentAnswer = useCallback(async () => {
    setSending(true);
    if (currentAnswer.id) {
      await dispatch(patchAnswer({ id: currentAnswer.id, data: currentAnswer })).unwrap();
    } else {
      const newAnswer = {
        ...currentAnswer,
        questionId: currentAnswer.question.id,
        questionText: currentAnswer.question.question
      };
      await dispatch(createAnswer([newAnswer])).unwrap();
    }
    await dispatch(findSortedAnswers()).unwrap();
    // update user and questionnaire and check if level changed
    const oldUser = { ...user };
    const newUser = await dispatch(getUser({})).unwrap();
    if (oldUser.level.order !== newUser.level.order) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLevelAnimationOptions({ show: true, oldUser, newUser });
    }
    setSending(false);
    if (answersStatus === 'succeeded') {
      bottomSheetModalRef.current?.close();
    }
  });

  const handleAnswerChange = (_, answer) => {
    setCurrentAnswer({
      ...currentAnswer,
      answer: answer,
    });
  }

  const handleAnimationFinished = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLevelAnimationOptions({ show: false, oldUser: {}, newUser: {} });
  }

  if (levelAnimationOptions.show) {
    return (
      <LevelAnimationScreen
        oldUser={levelAnimationOptions.oldUser}
        newUser={levelAnimationOptions.newUser}
        onFinished={handleAnimationFinished}
      />
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 flex px-7">
        <MenuHeader name={menuName} />
        <ScrollView>
          { newItems.length > 0 && (
            <View>
              <Text className="font-montserrat-alt-bold text-pink-dark mb-2">{t('answers.newQuestions')}</Text>
              <MenuList items={newItems} />
            </View>
          )}
          <MenuList items={items} />
        </ScrollView>
      </View>
      {/* answer edition modal */}
      <BottomSheet ref={bottomSheetModalRef} enableDynamicSizing>
        <View className="flex-1 flex flex-col items-start justify-between">
          { currentAnswer && (
              <QuestionsIndex
                questions={[currentAnswer.question]}
                previousAnswers={currentAnswer.question?.id ? {[currentAnswer.question.id]: currentAnswer.answer} : {}}
                onAnswerChange={handleAnswerChange}
                hideProgressBar
                buttonRowType="none"
                insideBottomSheet
                noScroll
              />
          )}
          <View className="pt-8 pb-16 w-full">
            <Button onPress={patchCurrentAnswer} color="pink" disabled={sending}>
              {sending ? (
                <View className="h-6 justify-center">
                  <ActivityIndicator size="small" className="text-pink-dark" />
                </View>
              ) : (
                <View className="h-6 justify-center">
                  <Text className="text-pink-dark">Save</Text>
                </View>
              )}
            </Button>
          </View>
        </View>
      </BottomSheet>
    </ScreenWrapper>
  );
}

export default Answers;
