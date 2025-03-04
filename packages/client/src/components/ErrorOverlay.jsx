import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import Constants from 'expo-constants';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { clearError } from '../store/models/errorSlice';
import { logout } from '../utils/fetchMiddlewareAuthentication';
import Button from './Button';
import { useAnalytics } from '../hooks/useAnalytics';

const APP_VERSION = Constants.expoConfig.version;

const ErrorOverlay = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { error } = useSelector((state) => state.error);
  const { t } = useTranslation();
  const analytics = useAnalytics();

  if (!error) return null;

  console.log('error', error);

  let errorMessage = t('errorOverlays.errors.default.errorMessage');
  let actionText = t('errorOverlays.errors.default.actionText');
  let imageSource = require('../assets/images/walking-lady.png');

  switch (error.type) {
    case 'UnauthorizedError':
      errorMessage = t('errorOverlays.errors.unauthorizedError.errorMessage');
      actionText = t('errorOverlays.errors.unauthorizedError.actionText');
      break;
    case 'ForbiddenError':
      errorMessage = t('errorOverlays.errors.forbiddenError.errorMessage');
      break;
    case 'NotFoundError':
      errorMessage = t('errorOverlays.errors.notFoundError.errorMessage');
      break;
    case 'ServerError':
      errorMessage = t('errorOverlays.errors.serverError.errorMessage');
      imageSource = require('../assets/images/walk-outside.png');
      break;
    case 'AuthenticationError':
      errorMessage = t('errorOverlays.errors.authenticationError.errorMessage');
      actionText = t('errorOverlays.errors.authenticationError.actionText');
      break;
    case 'NetworkError':
      errorMessage = t('errorOverlays.errors.networkError.errorMessage');
      imageSource = require('../assets/images/walk-outside.png');
      break;
    default:
      errorMessage = t('errorOverlays.errors.default.errorMessage');
      break;
  }

  const handleAction = () => {
    dispatch(clearError());
    if (
      error.type === 'UnauthorizedError' ||
      error.type === 'AuthenticationError'
    ) {
      logout();
    } else {
      navigation.navigate('Welcome');
    }
    analytics.capture('Error screeen showed',  {
      error: error.message,
      type: 'errorScreenShowed',
      details: { message: error.message },
    });
  };

  return (
    <Modal transparent visible={!!error} animationType="fade">
      <View className="flex-1 justify-center items-center bg-cream">
        <View className="h-full w-full flex items-center justify-center px-20 gap-8">
          <Text className="text-center text-blue typography-title3-emphasized font-montserrat-alt-bold">
            {t('errorOverlays.title')}
          </Text>
          <Image
            className="w-44 h-44 aspect-auto"
            resizeMode="contain"
            source={imageSource}
          />
          <Text className="text-center typography-body-regular font-inter-light">
            {errorMessage}
          </Text>
          <View className="self-stretch flex flex-row justify-center gap-2">
            <Button
              onPress={handleAction}
              color="pink"
              big
              className="flex-1"
            >
              <Text className="typography-body-emphasized text-pink-dark">
                {actionText}
              </Text>
            </Button>
          </View>
          <View className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-1">
            <Text className="text-sm text-gray-600 text-center">
              {`${APP_VERSION}` }
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ErrorOverlay;
