import * as Localization from 'expo-localization';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IntlProvider } from 'react-intl';
import { flatten } from 'flat';
import en from './src/translations/en.json';
import de from './src/translations/de.json';
import languageEventEmitter from './src/utils/languageEventEmitter';

const messages = {
  en,
  de,
};

// Extract the language code (e.g., 'en' from 'en-US')
let defaultLocale = Localization.locale.split('-')[0] || 'en';
if (defaultLocale !== 'de') {
  defaultLocale = 'en';
}

const IntlWrapper = ({ children }) => {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    const getStoredLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('customLanguage');
        if (storedLanguage) {
          setLocale(storedLanguage);
        }
      } catch (error) {
        console.error('Error reading language from AsyncStorage:', error);
      }
    };

    getStoredLanguage();

    const handleLanguageChange = (newLanguage) => {
      setLocale(newLanguage);
    };

    languageEventEmitter.addListener(handleLanguageChange);

    return () => {
      languageEventEmitter.removeListener(handleLanguageChange);
    };
  }, []);

  return (
    <IntlProvider locale={locale} messages={flatten(messages[locale])}>
      {children}
    </IntlProvider>
  );
}

export default IntlWrapper;
