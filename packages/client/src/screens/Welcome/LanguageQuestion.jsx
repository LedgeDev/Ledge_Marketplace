import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/Button';
import SingleSelectQuestion from '../../components/questions/questionTypes/SingleSelectQuestion';
import ScreenWrapper from '../../components/ScreenWrapper';
import languageEventEmitter from '../../utils/languageEventEmitter';
import { useTranslation } from '../../hooks/useTranslation';
import ArrowRightPink from '../../assets/svg/arrow-right-pink-2.svg';

const question = {
  question: {
    en: "What is your preferred language?",
    de: "Was ist Ihre bevorzugte Sprache?"
  },
  subtitle: {
    en: "For a better experience, we recommend choosing English",
    de: "Für ein besseres Erlebnis empfehlen wir Englisch zu wählen"
  },
  options: [
    { id: 'en', en: 'English', de: 'Englisch' },
    { id: 'de', en: 'German (beta)', de: 'Deutsch (beta)' },
  ]
};

const LanguageQuestion = ({ onLanguageSet }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.data);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem('customLanguage');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    };
    loadLanguage();
  }, []);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleConfirm = async () => {
    if (selectedLanguage) {
      await AsyncStorage.setItem('customLanguage', selectedLanguage);
      // Emit an event to notify that the language has changed
      languageEventEmitter.emit(selectedLanguage);
      onLanguageSet();
    }
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 px-7">
        <Text className="font-montserrat-alt-bold text-lg text-pink py-6">Welcome to ledge</Text>
        <SingleSelectQuestion
          question={question}
          noScroll
          onAnswersChange={({ optionId }) => handleLanguageSelect(optionId)}
          forceListLayout
          subtitleBolder
        />
        <Button
          onPress={handleConfirm}
          color="pink"
          disabled={!selectedLanguage}
          className="mb-16"
        >
          <View className="flex-row items-center gap-3">
            <Text className="text-pink-dark">{t('languageQuestion.button')}</Text>
            <ArrowRightPink />
          </View>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default LanguageQuestion;
