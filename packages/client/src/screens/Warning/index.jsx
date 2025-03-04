import React, { useCallback, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import EventBus from 'react-native-event-bus';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Constants from 'expo-constants';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useExternalUrl } from '../../hooks/useExternalUrl';

const APP_VERSION = Constants.expoConfig.version;

function WarningScreen({ route }) {
  const { t } = useTranslation();
  const { openExternalUrl } = useExternalUrl();
  const navigation = useNavigation();
  const { latestVersion } = route.params;

  // Disable the sidebar button when entering this screen
  useFocusEffect(
    useCallback(() => {
      EventBus.getInstance().fireEvent("showButton", { value: false });

      // Override navigation to prevent navigating away
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Prevent default behavior of leaving the screen
        e.preventDefault();
      });

      // Clean up listener on unmount
      return () => {
        unsubscribe();
      };
    }, [navigation])
  );

  // Additional safeguard to ensure navigation actions don't take the user away
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Warning' }],
      });
    });

    return unsubscribeFocus;
  }, [navigation]);

  return (
    <ScreenWrapper>
      <View className="flex-1 justify-center items-center gap-8 px-12">
        <Text className="text-2xl text-blue font-montserrat-alt-bold">
          {t('warning.title')}
        </Text>
        <Image
          className="h-60 self-center"
          resizeMode="contain"
          source={require('../../assets/images/update.png')}
        />
        <Text className="text-lg text-blue text-center">
          {t('warning.subtitle')}
        </Text>
        <Button
          onPress={() => openExternalUrl(process.env.APP_STORE_URL)}
          className="w-full"
          color="pink"
          big
        >
          <Text className="text-pink-dark font-montserrat-alt-bold">
            {t('warning.button')}
          </Text>
        </Button>
        <View className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-1">
          <Text className="text-sm text-gray-600 text-center">
            {`${APP_VERSION}` }
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            {`${t('warning.latestVersion')}: ${latestVersion}` }
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

export default WarningScreen;
