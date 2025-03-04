import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Animated,
  AppState,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { patchUser, changeEmail } from '../../store/models/users';
import { useNavigation } from '@react-navigation/native';
import { useAuthService } from '../../services/authService';
import { useTranslation } from '../../hooks/useTranslation';
import { useNotifications } from '../../hooks/useNotifications';
import ScreenWrapper from '../../components/ScreenWrapper';
import MenuHeader from '../../components/MenuHeader';
import MenuElement from '../../components/MenuElement';
import BottomSheet from '../../components/BottomSheet';
import Button from '../../components/Button';
import SingleSelectQuestion from '../../components/questions/questionTypes/SingleSelectQuestion';
import { useExternalUrl } from '../../hooks/useExternalUrl';
import { checkBoolFromStorage } from '../../utils/check-bool-from-storage';
import TrashRed from '../../assets/svg/trash-red.svg';
import CheckCirclePink from '../../assets/svg/check-circle-pink.svg';
import RestoreDeletedBrands from './settingsComponents/restoreDeletedBrands';
import { useAnalytics } from '../../hooks/useAnalytics';
import languageEventEmitter from '../../utils/languageEventEmitter';

function SettingsTextInput({ name, value, onChangeText, placeholder, readOnly, error }) {
  return (
    <View className="relative">
      <Text maxFontSizeMultiplier={1.3} className="absolute top-3 left-5 text-gray-400 text-sm h-5">{ name }</Text>
      <BottomSheetTextInput
        maxLength={50}
        className={`border ${error ? 'border-red' : 'border-gray-200'} border-1 rounded-lg p-4 ${name ? 'pt-10' : ''} font-inter-light`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        readOnly={readOnly}
        autoCapitalize="none"
      />
    </View>
  );
}

const MenuElementWrapper = forwardRef(({ children, type }, ref) => {
  const bgColorValue = useRef(new Animated.Value(0)).current;

  const blink = () => {
    Animated.sequence([
      Animated.timing(bgColorValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bgColorValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bgColorValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bgColorValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useImperativeHandle(ref, () => ({
    blink,
  }));

  const interpolatedColor = bgColorValue.interpolate({
    inputRange: [0, 1],
    outputRange: type === 'info' ? ['#F1F1F1', '#E0E0E0'] : ['#FFFFFF', '#E0E0E0'], // Adjust colors as needed
  });

  return (
    <Animated.View
      className={`rounded-2xl overflow-hidden`}
      style={{
        backgroundColor: interpolatedColor,
      }}
    >
      {children}
    </Animated.View>
  );
});

function ChangeEmailSheetContent({ bottomSheetModalRef }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showError, setShowError] = useState(null);
  const [enteredText, setEnteredText] = useState(false);
  const user = useSelector(state => state.users.data);
  const verified = useRef(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  handleEnteredTextChange = (text) => {
    setEnteredText(text);
    if (verified.current && !validateEmail(text)) {
      setShowError(true);
      return
    }
    setShowError(null);
  };

  const handleEmailChange = async () => {
    // validate email
    verified.current = true;
    if (!validateEmail(enteredText)) {
      setShowError(true);
      return
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoading(true);
    // pending to implement: dispatch change email action
    // await dispatch(changeEmail({ email: enteredText })).unwrap();
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // setLoading(false);
    // setShowMessage(true);

    // Mocking the loading and success message
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowMessage(true);
      setLoading(false);
    }, 2000);
  };
  if (showMessage) {
    return (
      <View className="w-full h-full">
        <View className="flex-1 mb-10">
          <Text className="font-montserrat-alt-bold mb-10">
            { t('settings.changeEmail.menuTitle') }
          </Text>
          <View className="flex-1 items-center justify-center">
            <CheckCirclePink width={50} height={50} />
            <Text className="text-center font-montserrat-alt text-md mt-4">
              { t('settings.changeEmail.verificationMessage') }
            </Text>
          </View>
        </View>
        <View className="bg-white pb-10">
          <Button big onPress={() => bottomSheetModalRef.current?.close(true)} color="pink" disabled={loading}>
            <Text className="text-pink-dark font-montserrat-alt-bold">{ t('settings.changeEmail.continue') }</Text>
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="w-full h-full">
        <View className="flex-1 mb-10">
          <Text className="font-montserrat-alt-bold mb-10">
            { t('settings.changeEmail.menuTitle') }
          </Text>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#999999" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="w-full h-full">
      <View className="flex-1">
        <Text className="font-montserrat-alt-bold">
          { t('settings.changeEmail.menuTitle') }
        </Text>
        <View className="flex gap-6 my-7">
          <SettingsTextInput
            value={user.email}
            readOnly
            name={t('settings.changeEmail.inputs.oldEmail')}
          />
          <SettingsTextInput
            value={enteredText}
            onChangeText={handleEnteredTextChange}
            placeholder={t('settings.changeEmail.inputs.placeholder')}
            name={t('settings.changeEmail.inputs.newEmail')}
            error={showError}
          />
        </View>
      </View>
      <View className="bg-white pb-10">
        <Button big onPress={handleEmailChange} color="pink" disabled={loading}>
          <Text className="text-pink-dark font-montserrat-alt-bold">{ t('settings.confirm') }</Text>
        </Button>
      </View>
    </View>
  )
}

function LanguageSheetContent({ bottomSheetModalRef }) {
  const { t, locale } = useTranslation();
  const [sending, setSending] = useState(false);
  const newLanguage = useRef(null);

  const setCustomLanguage = async () => {
    if (newLanguage.current === locale) {
      return;
    }
    try {
      setSending(true);
      await AsyncStorage.setItem('customLanguage', newLanguage.current);

      // Emit the language change event
      languageEventEmitter.emit(newLanguage.current);

      // Update the user's language preference in the backend if needed
      // await dispatch(updateUserLanguage(newLanguage.current));

      bottomSheetModalRef.current?.close(true);
      setSending(false);
    } catch (error) {
      console.error('Error setting language:', error);
      setSending(false);
    }
  };

  const handleAnswer = (answer) => {
    newLanguage.current = answer.optionId;
  };

  const languageQuestion = {
    options: [
      { id: 'en', en: 'English', de: 'Englisch' },
      { id: 'de', en: 'German', de: 'Deutsch' },
    ]
  }

  return (
    <View className="w-full h-full">
      <View className="flex-1 mb-10">
        <Text className="font-montserrat-alt-bold mb-10">
          { t('settings.language.menuTitle') }
        </Text>
        <SingleSelectQuestion
          question={languageQuestion}
          answer={{ optionId: newLanguage?.current ? newLanguage?.current : locale }}
          onAnswersChange={handleAnswer}
          hideTitles
        />
      </View>
      <View className="bg-white pb-10">
        <Button big onPress={setCustomLanguage} color="pink" disabled={sending}>
          {sending ?
            <ActivityIndicator size="small" className="text-pink-dark" /> :
            <Text className="text-pink-dark font-montserrat-alt-bold">{ t('settings.confirm') }</Text>
          }
        </Button>
      </View>
    </View>
  )
}

function DeleteDataSheetContent({ bottomSheetModalRef }) {
  const { t } = useTranslation();
  const { handleDeleteAccount } = useAuthService();
  const navigation = useNavigation();
  const [sending, setSending] = useState(false);

  const deleteAccount = async () => {
    try {
      await handleDeleteAccount();
      navigation.navigate('Welcome');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View className="w-full h-full">
      <View className="flex-1 mb-10">
        <Text className="font-montserrat-alt-bold">
          { t('settings.deleteData.menuTitle') }
        </Text>
        <Text className="mt-4 font-inter-light mb-6">
          { t('settings.deleteData.menuDescription') }
        </Text>
        <Button big onPress={() => bottomSheetModalRef.current?.close(true)} className="mb-6" color="pink" disabled={sending}>
          <Text className="text-pink-dark font-montserrat-alt-bold">{ t('settings.deleteData.cancel') }</Text>
        </Button>
        <Button big onPress={deleteAccount} color="red" disabled={sending}>
          {sending ?
            <ActivityIndicator size="small" className="text-pink-dark" /> :
            <Text className="text-white font-montserrat-alt-bold">{ t('settings.deleteData.confirm') }</Text>
          }
        </Button>
      </View>
    </View>
  )
}


function SettingsScreen() {
  const { handleLogout } = useAuthService();
  const {
    askAndRegisterForPushNotifications,
    unregisterForPushNotifications,
    openSettings,
    checkNotificationsPermission,
  } = useNotifications();
  const navigation = useNavigation();
  const { openExternalUrl } = useExternalUrl();
  const { t } = useTranslation();
  const user = useSelector(state => state.users.data);
  const bottomSheetModalRef = useRef(null);
  const [sheetContent, setSheetContent] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(user?.notificationsToken ? true : false);
  const [managingNotifications, setManagingNotifications] = useState(false);
  const [showNotificationMessage, setShowNotificationMessage] = useState(false);
  const analytics = useAnalytics();
  const notificationsMessageRef = useRef(null);

  useEffect(() => {
    const checkNotifications = async () => {
      const status = await checkNotificationsPermission();
      if (Platform.OS !== 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setShowNotificationMessage(!status);
    };
    checkNotifications();

    const appStateListener = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active') {
          checkNotifications();
        }
      },
    );

    return () => {
      appStateListener.remove();
    };
  }, []);

  const logout = async () => {
    try {
      await handleLogout();
      navigation.navigate('Welcome');
      analytics.capture("Logout", {
        value: user.id,
        type: 'logout',
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleNotificationChange = async (enabled) => {
    if (managingNotifications.current === true) {
      return;
    }
    setManagingNotifications(true);
    setNotificationEnabled(enabled);
    if (enabled) {
      const result = await askAndRegisterForPushNotifications();
      if (result) {
        if (Platform.OS !== 'android') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }
        setShowNotificationMessage(false);
        await checkBoolFromStorage('notificationsAsked');
      } else {
        setNotificationEnabled(false);
        if (Platform.OS !== 'android') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }
        setShowNotificationMessage(true);
        notificationsMessageRef.current?.blink();
      }
    } else {
      await unregisterForPushNotifications();
    }
    setManagingNotifications(false);
  }

  const showBottomSheet = useCallback((content) => {
    switch (content) {
      case 'language':
        setSheetContent(<LanguageSheetContent bottomSheetModalRef={bottomSheetModalRef} />);
        break;
      case 'changeEmail':
        setSheetContent(<ChangeEmailSheetContent bottomSheetModalRef={bottomSheetModalRef} />);
        break;
      case 'deleteData':
        setSheetContent(<DeleteDataSheetContent bottomSheetModalRef={bottomSheetModalRef} />);
        break;
      case 'deleteBrands':
        setSheetContent(<RestoreDeletedBrands bottomSheetModalRef={bottomSheetModalRef} />);
        break;
      default:
        break;
    }
    bottomSheetModalRef.current?.show(true);
  }, []);

  return (
    <ScreenWrapper>
      <View className="flex-1 flex">
        <View className="px-7">
          <MenuHeader name={t('settings.title')} />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingLeft: 28, paddingRight: 28 }}
        >
          <Text>{ t('settings.hello') }<Text className="font-montserrat-alt-bold">{ user?.name ? (', ' + user.name) : null }!</Text></Text>
          <View className="flex flex-col items-stretch w-full gap-4 mt-4 mb-10">
            <MenuElementWrapper>
              <MenuElement
                title={t('settings.notifications.title')}
                description={t('settings.notifications.description')}
                onPress={handleNotificationChange}
                isToggle
                toggleValue={notificationEnabled}
                toggleDisabled={managingNotifications}
              />
            </MenuElementWrapper>
            {showNotificationMessage && (
              <MenuElementWrapper ref={notificationsMessageRef} type="info">
                <MenuElement
                  title={t('settings.notifications.enableTitle')}
                  description={t('settings.notifications.enableDescription')}
                  onPress={openSettings}
                />
              </MenuElementWrapper>
            )}
            <MenuElementWrapper>
              <MenuElement
                title={t('settings.language.title')}
                description={t('settings.language.description')}
                onPress={() => showBottomSheet('language')}
              />
            </MenuElementWrapper>
            <MenuElementWrapper>
              <MenuElement
                title={t('settings.myDataView.title')}
                description={t('settings.myDataView.description')}
                onPress={() => openExternalUrl('https://www.ledge.eu')}
              />
            </MenuElementWrapper>
            <MenuElementWrapper>
              <MenuElement
                title={t('settings.myDataDeletedBrands.title')}
                description={t('settings.myDataDeletedBrands.description')}
                onPress={() => showBottomSheet('deleteBrands')}
              />
            </MenuElementWrapper>
            <Button
              className="w-56"
              color="gray"
              onPress={() => showBottomSheet('deleteData')}
            >
              <Text className="text-red">
                {t('settings.deleteData.title')}
              </Text>
            </Button>
            <Button
              className="w-56"
              color="gray"
              onPress={logout}
            >
              <Text>
                {t('settings.logOut')}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </View>
      <BottomSheet
        ref={bottomSheetModalRef}
        manageNavButton
        snapPoints={['60%']}
      >
        <View className="flex-1 flex flex-col items-start justify-between pb-6 border">
          {sheetContent}
        </View>
      </BottomSheet>
    </ScreenWrapper>
  );
}

export default SettingsScreen;
