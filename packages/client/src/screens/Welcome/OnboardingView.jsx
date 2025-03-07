import React, { useEffect, useState } from 'react';
import { Text, View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { patchUser } from '../../store/models/users';
import ScreenWrapper from '../../components/ScreenWrapper';
import QuestionsIndex from '../../newComponents/questions/QuestionsIndex';

const OnboardingView = ({ onLoad = () => {} }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const onboardingQuestions = [
    {
      id: 'ai-text',
      type: 'text',
      question: {
        en: 'Welcome to ledge!',
      },
      subtitle: {
        en: 'First, in order to personalize your experience, please tell us a little about' + 
        'how you would like our AI to create your posts. For example: ' +
        'I want the prices to be as low as possible, or ' +
        'I want the AI to choose the most aesthetic photos, or ' +
        'I want to get the maximum benefit from my offers.' +
        '\n\nThis is completely optional and you can change this later in the settings.',
      },
    },
    {
      id: 'phone-number',
      type: 'text',
      question: {
        en: 'Phone number for contact',
      },
      subtitle: {
        en: 'Now, you can optionally provide your phone number to allow your buyers to contact you.',
      },
    },
  ];

  const handlePostAnswers = async (answers) => {
    console.log('answers', answers);
    const aiText = answers['ai-text'];
    const phoneNumber = answers['phone-number'];
    await dispatch(patchUser({ aiPersonalizationText: aiText, phoneNumber })).unwrap();
    navigation.navigate('Explore');
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 w-full h-full px-8 pb-14">
        <Text className="font-montserrat-alt-bold text-pink mb-3 mt-4">
          ledge Onboarding
        </Text>
        <QuestionsIndex
          questions={onboardingQuestions}
          onLastQuestionNext={handlePostAnswers}
        />
      </View>
    </ScreenWrapper>
  );
};

export default OnboardingView;
