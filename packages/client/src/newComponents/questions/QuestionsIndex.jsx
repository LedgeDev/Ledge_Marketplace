import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import React,{
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../Button';
import ProgressBar from '../ProgressBar';
import MultiSelectQuestion from './questionTypes/MultiSelectQuestion';
import ScaleQuestion from './questionTypes/ScaleQuestion';
import SingleSelectQuestion from './questionTypes/SingleSelectQuestion';
import RankingQuestion from './questionTypes/RankingQuestion';
import VisualRankingQuestion from './questionTypes/VisualRankingQuestion';
import TextQuestion from './questionTypes/TextQuestion';
import ThisOrThatQuestion from './questionTypes/ThisOrThatQuestion';
import PricingFeedbackQuestion from './questionTypes/PricingFeedbackQuestion';
import CategorizedMultiSelectQuestion from './questionTypes/CategorizedMultiSelectQuestion';
import LocationQuestion from './questionTypes/LocationQuestion';
import BlackArrowLeftIcon from '../../assets/svg/arrow-left-black.svg';
import PinkArrowRightIcon from '../../assets/svg/arrow-right-pink-2.svg';
import { useAnalytics } from '../../hooks/useAnalytics';

const questionComponents = {
  'multi-select': MultiSelectQuestion,
  'scale': ScaleQuestion,
  'ranking': RankingQuestion,
  'single-select': SingleSelectQuestion,
  'text': TextQuestion,
  'this-or-that': ThisOrThatQuestion,
  'visual-ranking': VisualRankingQuestion,
  'pricing-feedback': PricingFeedbackQuestion,
  'categorized-multi-select': CategorizedMultiSelectQuestion,
  'location': LocationQuestion,
};

const QuestionsIndex = forwardRef(({
  questions,
  previousAnswers = {},
  onLastQuestionNext = () => {},
  onAnswerChange = () => {},
  onAnswersChange = () => {},
  onStepChange = () => {},
  onWrongAnswer = () => {},
  hideProgressBar,
  allowSkip = false,
  insideBottomSheet,
  noScroll,
  buttonRowType = 'default',
}, ref) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(previousAnswers);
  const [canContinue, setCanContinue] = useState(false);
  const [width, setWidth] = useState(0);
  const flatListRef = useRef(null);
  const questionsGap = 40;
  const { t } = useTranslation();
  const analytics = useAnalytics();

  const resetAnswers = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
  });

  // expose resetAnswers method
  useImperativeHandle(ref, () => ({
    resetAnswers,
  }));

  const moveToPreviousQuestion = useCallback((currentStep) => {
    if (currentStep === 0) {
      return;
    }
    setCurrentStep(currentStep - 1);
    setCanContinue(true);
  });

  const moveToNextQuestion = useCallback((currentStep, answers) => {
    setCanContinue(allowSkip || checkCanContinue(currentStep + 1, answers));
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onLastQuestionNext(answers);
    }
  }, [questions, allowSkip, checkCanContinue]);

  const checkCanContinue = useCallback((currentStep, answers) => {
    const question = questions[currentStep];
    if (!question) return false;
    if (question.type === 'this-or-that') {
      // in this-or-that questions all options need to be swiped to be able to continue
      if (!answers[question.id] || Object.values(answers[question.id]).some(answer => answer.answer === null)) {
        return false;
      }
      return true;
    }
    if (answers[question.id] || allowSkip) {
      return true;
    }
  }, [questions, allowSkip]);

  const handleAnswerChange = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    const question = questions[currentStep];
    // check if answer is correct
    if (question.correctAnswerId) {
      if (question.correctAnswerId === answer.optionId) {
        setCanContinue(true);
      } else {
        setCanContinue(false);
        onWrongAnswer(questionId, answer);
      }
    } else {
      // save the answer
      setAnswers(newAnswers);
      onAnswerChange(questionId, answer);
      onAnswersChange(newAnswers);
      // check if can continue
      const userCanContinue = checkCanContinue(currentStep, newAnswers);
      if (question.type === 'single-select' || question.type === 'scale') {
        if (currentStep === questions.length - 1) {
          onLastQuestionNext(newAnswers);
        } else {
          moveToNextQuestion(currentStep, newAnswers);
        }
      } else if (userCanContinue) {
        setCanContinue(true);
      }
    }
  };

  useEffect(() => {
    // scroll to the current question based on the currentStep
    if (flatListRef.current && currentStep >= 0 && currentStep < questions.length) {
      flatListRef.current.scrollToIndex({ index: currentStep, animated: true });
    }
    onStepChange(currentStep);
  }, [currentStep]);

  const renderQuestion = useCallback((question, index) => {
    const QuestionComponent = questionComponents[question.type];
    if (!QuestionComponent) {
      return (
        <View className="h-full pt-6" style={{ width }}>
          <Text className="mx-auto">
            Unsupported question type: {question.type}
          </Text>
        </View>
      );
    }
    return (
      <View className={`overflow-visible h-full`} style={{ width }}>
        <QuestionComponent
          question={question}
          answer={answers[question.id]}
          onAnswersChange={(answer) =>
            handleAnswerChange(question.id, answer)
          }
          insideBottomSheet={insideBottomSheet}
          noScroll={noScroll}
          isCurrentQuestion={index === currentStep}
        />
      </View>
    )
  },[answers, currentStep, width]);

  return (
    <View className="flex-1 w-full">
      <View className="h-full w-full">
        {!hideProgressBar && (
          <ProgressBar
            totalSteps={questions.length}
            currentStep={currentStep}
            horizontal
          />
        )}
        <View
          className={`flex-1 w-full ${hideProgressBar ? 'pt-0' : 'pt-6'}`}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
          <FlatList
            ref={flatListRef}
            className="overflow-visible"
            data={questions}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => renderQuestion(item, index)}
            horizontal
            ItemSeparatorComponent={() => <View style={{ width: questionsGap }} />}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width + questionsGap}
            decelerationRate="fast"
            scrollEnabled={false}
            getItemLayout={(data, index) => ({ length: width + questionsGap, offset: (width + questionsGap) * index, index })}
            keyboardShouldPersistTaps="handled"
          />
        </View>
        <View className="w-full flex flex-row justify-between gap-2 bg-transparent">
          {['back', 'default'].includes(buttonRowType) && (
            <View className="grow">
              <Button
                color="gray"
                onPress={() => moveToPreviousQuestion(currentStep)}
                prependIcon={<BlackArrowLeftIcon className="opacity-90" width={24} height={24} />}
                disabled={currentStep === 0}
              >
                <Text className="font-inter text-ledge-black">
                  {t('questions.back')}
                </Text>
              </Button>
            </View>
          )}
          {['forward', 'default'].includes(buttonRowType) && (
            <View className="grow">
              <Button
                color="pink"
                onPress={() => moveToNextQuestion(currentStep, answers)}
                appendIcon={<PinkArrowRightIcon className="opacity-90" width={24} height={24} />}
                disabled={!canContinue}
              >
                <Text className="font-inter text-ledge-pink">
                  {currentStep === questions.length - 1 ? t('questions.finish') : t('questions.next')}
                </Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

export default QuestionsIndex;
