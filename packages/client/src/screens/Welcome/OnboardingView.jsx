import React, { useEffect, useState } from 'react';
import { Text, View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { postOnboardingAnswers } from '../../store/models/users';
import { fetchOnboardingQuestions } from '../../store/models/questions';
import ThankYouScreen from '../../newComponents/intermediateScreens/ThankYouScreen';
import ProfileSetupView from './ProfileSetupView';
import FriendsInviteView from './FriendsInviteView';
import ScreenWrapper from '../../components/ScreenWrapper';
import QuestionsIndex from '../../newComponents/questions/QuestionsIndex';

const OnboardingView = ({ onLoad = () => {} }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [showThankYou, setShowThankYou] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showFriendsInvite, setShowFriendsInvite] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const status = useSelector((state) => state.questions.status);
  const error = useSelector((state) => state.questions.error);
  const onboardingQuestions = useSelector(
    (state) => state.questions.onboarding,
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const getOnboardingQuestions = async () => {
      await dispatch(fetchOnboardingQuestions()).unwrap();
      onLoad();
    };
    getOnboardingQuestions();
  }, [dispatch]);

  const finishIfCompleted = (newCurrentAnswers) => {
    setCurrentAnswers(newCurrentAnswers);
    // everytime the answers change, check if the onboarding is completed
    // check if the answers length is the same as the questions length
    const answerAmountCheck = Object.keys(newCurrentAnswers).length === onboardingQuestions.length;

    if (!answerAmountCheck) return;
    let allAnswersFilled = true;
    for (const key in newCurrentAnswers) {
      // check that answer is defined
      if (!newCurrentAnswers[key]) {
        allAnswersFilled = false;
        break;
      }
      // if question is this or that, check that all swipes are done
      const question = onboardingQuestions.find((q) => q.id === key);
      if (question.type === 'this-or-that') {
        const answer = newCurrentAnswers[key];
        if (Object.keys(answer).some((categoryId) => answer[categoryId].answer === null)) {
          allAnswersFilled = false;
          break;
        }
      }
    }
  }

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLastQuestionNext = async (answers) => {
    setCurrentAnswers(answers);
    setShowThankYou(true);

    try {
      await dispatch(postOnboardingAnswers(answers)).unwrap();
    } catch (error) {
      console.error('Error saving onboarding answers:', error);
      // Optionally handle the error case - maybe show an error message
      // but still allow the user to continue to profile setup
    }
  };

  const handleThankYouFinished = () => {
    setShowThankYou(false);
    setShowProfileSetup(true);
  };

  const handleProfileSetupComplete = (picture) => {
    setProfilePicture(picture);
    setShowProfileSetup(false);
    setShowFriendsInvite(true);
  };

  if (showFriendsInvite) {
    return <FriendsInviteView profilePicture={profilePicture} />;
  }

  if (showProfileSetup) {
    return <ProfileSetupView onComplete={handleProfileSetupComplete} />;
  }

  if (showThankYou) {
    return (
      <ThankYouScreen
        onFinished={handleThankYouFinished}
        animationTime={1000}
      />
    );
  }

  if (status === 'loading' || onboardingQuestions.length === 0) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <ScreenWrapper>
        <View className="flex-1 w-full h-full px-8 pb-14">
          <Text className="font-montserrat-alt-bold text-pink mb-3 mt-4">
            ledge Onboarding
          </Text>
          <QuestionsIndex
            questions={onboardingQuestions}
            onAnswersChange={finishIfCompleted}
            onStepChange={setCurrentStep}
            onLastQuestionNext={handleLastQuestionNext}
          />
        </View>
      </ScreenWrapper>
    </TouchableWithoutFeedback>
  );
};

export default OnboardingView;
