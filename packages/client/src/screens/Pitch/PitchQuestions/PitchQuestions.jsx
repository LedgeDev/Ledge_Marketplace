import React, { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { View, ActivityIndicator, LayoutAnimation, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getUser, setViewedPitch } from '../../../store/models/users';
import { postPitchAnswers } from '../../../store/models/answers';
import { getForYouBrands, getDiscoveryBrands } from '../../../store/models/brands';
import { fetchBenefits } from '../../../store/models/benefits';
import PitchQuestionsProgressBar from './PitchQuestionsProgressBar';
import ScreenWrapper from '../../../components/ScreenWrapper';
import QuestionsIndex from '../../../components/questions/QuestionsIndex';
import LevelAnimationScreen from '../../../components/intermediateScreens/LevelAnimationScreen';
import BottomSheet from '../../../components/BottomSheet';
import Button from '../../../components/Button';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { checkBrandUnlocked } from '../../../utils/brand-utils';

// Create a preloader utility
const preloadComponent = (importFn) => {
  let component = null;
  let promise = null;

  return {
    preload() {
      if (!promise) {
        promise = importFn().then(module => {
          component = module.default;
          return component;
        });
      }
      return promise;
    },
    get Component() {
      if (!component && !promise) {
        this.preload();
      }
      if (!component) {
        throw promise;
      }
      return component;
    }
  };
};

// Create the lazy-loaded component with preloader
const PitchQuestionsThanksLoader = preloadComponent(() =>
  import('./PitchQuestionsThanks')
);

const PitchQuestions = ({ brand, toPitch, endQuestions = () => {}, questions, isExitQuestion, onQuit = () => {} }) => {
  const dispatch = useDispatch();
  const [brandAlreadyUnlocked] = useState(checkBrandUnlocked(brand));
  const [state, setState] = useState(brandAlreadyUnlocked ? '' : 'questions');
  const [canHideThankYou, setCanHideThankYou] = useState(brandAlreadyUnlocked ? true : false);
  const [savedAnswers, setSavedAnswers] = useState(brandAlreadyUnlocked ? true : false);
  const [currentStep, setCurrentStep] = useState(0);
  const [attentionTries, setAttentionTries] = useState(0);
  const [wrongAnswerModalVisible, setWrongAnswerModalVisible] = useState(false);
  const { t } = useTranslation();
  const analytics = useAnalytics();
  const pitchQuestions = questions;
  const user = useSelector((state) => state.users.data);
  const [oldUser, setOldUser] = useState({});
  const [newUser, setNewUser] = useState({});
  const bottomSheetModalRef = useRef(null);
  const questionsIndexRef = useRef(null);

  // Preload the PitchQuestionsThanks component when the main component mounts
  useEffect(() => {
    PitchQuestionsThanksLoader.preload();
  }, []);

  useEffect(() => {
    dispatch(getUser());
  }, []);

  // Handle end of questions
  useEffect(() => {
    const manageQuestionsFinished = async () => {
      if (canHideThankYou && savedAnswers) {
        if (oldUser.level?.order !== newUser.level?.order) {
          // check if the user level changed
          // dispatch benefits to update the user's benefits
          dispatch(fetchBenefits());
          setState('levelAnimation');
          // endQuestions will be called by the LevelAnimationScreen
        } else {
          endQuestions();
        }
      }
    };
    manageQuestionsFinished();
  }, [savedAnswers, canHideThankYou]);

  const sendUserAnswers = async (answers) => {
    try {
      const data = {
        brandId: brand.id,
        answers,
        pitch: isExitQuestion ? 'exit' : 'pitch',
      };
      if (isExitQuestion) {
        Object.entries(answers).forEach(([questionId, answer]) => {
          const question = questions.find(q => q.id === questionId);
          analytics.capture(`Exit question answered`, {
            question: question.question.en,
            brand: brand.name,
            answer: answer.value,
            type: 'exitQuestionAnswered',
            brandId: brand.id,
            details: {
              question: question.question.en,
              answer: answer.value,
            }
          });
        });
      }
      const result = await dispatch(postPitchAnswers(data)).unwrap();
      if (postPitchAnswers.fulfilled) {
        setSavedAnswers(true);
        setOldUser(user);
        // Fetch the user's data to update myDeals
        const newUser = await dispatch(getUser()).unwrap();
        setNewUser(newUser);
        if (isExitQuestion) {
          await dispatch(setViewedPitch(brand.id)).unwrap();
        }
        // get brand feeds in case the user chose to delete the brand
        dispatch(getDiscoveryBrands());
        dispatch(getForYouBrands());
      } else if (postPitchAnswers.rejected) {
        console.error('Failed to save answers:', result.payload);
      }
    } catch (error) {
      console.error('Error in sendUserAnswers:', error);
    }
  };

  const handleLastQuestionNext = async (answers) => {
    // Ensure PitchQuestionsThanks is preloaded before transitioning
    await PitchQuestionsThanksLoader.preload();

    // Send the user's answers. The logic for unlocking deals is behind this function
    sendUserAnswers(answers);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setState('thankYou');
      setTimeout(async () => {
        setCanHideThankYou(true);
      }, 4000);
  };

  const handleTryAgain = () => {
    bottomSheetModalRef.current?.close();
    setWrongAnswerModalVisible(false);
  };

  const handleWrongAnswer = (questionId, answer) => {
    setAttentionTries(prev => prev + 1);
    bottomSheetModalRef.current?.show();
    setWrongAnswerModalVisible(true);
  };

  const handleRewatch = useCallback(() => {
    bottomSheetModalRef.current?.close();
    questionsIndexRef.current?.resetAnswers();
    setAttentionTries(0);
    toPitch();
  });

  const founderImage = useMemo(() => {
    if (brand.founders && brand.founders.length > 0 && brand.founders[0].image) {
      return brand.founders[0].image;
    }
    return null;
  }, [brand.founders]);

  if (state === 'questions') {
    return (
      <ScreenWrapper>
        <View className="flex-1 w-full h-full px-8 pb-14">
          <View className="flex-1 w-full" pointerEvents={wrongAnswerModalVisible ? 'none' : 'auto'}>
            <PitchQuestionsProgressBar
              totalSteps={pitchQuestions.length}
              currentStep={currentStep}
              brand={brand}
              onClose={onQuit}
              t={t}
            />
            <QuestionsIndex
              ref={questionsIndexRef}
              questions={pitchQuestions}
              onLastQuestionNext={handleLastQuestionNext}
              onBackToPitch={toPitch}
              onStepChange={setCurrentStep}
              hideProgressBar
              onWrongAnswer={handleWrongAnswer}
            />
          </View>
          <BottomSheet snapPoints={['37%']} ref={bottomSheetModalRef} noScroll closeDisabled>
            <View className="w-full">
              <Text className="font-montserrat-alt-bold text-2xl text-ledge-black text-center mb-2">
                Ooops!
              </Text>
              <Text className="font-inter-light text-ledge-black text-center mb-10">
                {attentionTries < 2
                  ? 'Recheck your answer and try again!'
                  : 'Rewatch the pitch and try again!'}
              </Text>
              {attentionTries < 2 && (
                <Button
                  color="pink"
                  onPress={handleTryAgain}
                  big
                  className="mb-2"
                >
                  <Text className="text-lg text-ledge-pink font-montserrat-alt-bold">
                    Try again!
                  </Text>
                </Button>
              )}
              <Button
                color="gray"
                onPress={handleRewatch}
              >
                <Text className="typography-body-regular text-[#262C3099] opacity-80">
                  Rewatch Pitch
                </Text>
              </Button>
            </View>
          </BottomSheet>
        </View>
      </ScreenWrapper>
    );
  }

  if (state === 'thankYou') {
    return (
      <Suspense fallback={
        <View className="flex-1 w-full h-full items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      }>
        <PitchQuestionsThanksLoader.Component img={founderImage} t={t} />
      </Suspense>
    );
  }

  if (state === 'levelAnimation') {
    return (
      <LevelAnimationScreen
        oldUser={oldUser}
        newUser={newUser}
        onFinished={endQuestions}
      />
    );
  }

  if (state === 'loading') {
    return (
      <ScreenWrapper>
        <View className="flex-1 w-full h-full items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </ScreenWrapper>
    );
  }

  return <View className="flex-1 w-full bg-black"/>
};

export default PitchQuestions;
