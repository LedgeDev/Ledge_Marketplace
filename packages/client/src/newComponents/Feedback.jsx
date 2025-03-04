import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  LayoutAnimation,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { sendFeedback } from '../store/models/feedback';
import { sendBrandFeedback } from "../store/models/brands";
import Button from './Button';
import Checkbox from './Checkbox';
import { useTranslation } from '../hooks/useTranslation';
import { useAnalytics } from '../hooks/useAnalytics';

function Feedback({ onFinished = () => {}, onSent = () => {}, brand, insideBottomSheet }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [enteredText, setEnteredText] = useState(null);
  const [addEmail, setAddEmail] = useState(false);
  const [email, setEmail] = useState(null);
  const [showTextError, setShowTextError] = useState(null);
  const [showEmailError, setShowError] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [loading, setLoading] = useState(false);
  const verified = useRef(false);
  const analytics = useAnalytics();

  const handleTextChange = (text) => {
    setEnteredText(text);
    if (verified.current && !validateText(text)) {
      setShowTextError(true);
      return;
    }
    setShowTextError(false);
  };

  const handleEmailTextChange = (text) => {
    // omit if last character is a newline
    if (text.slice(-1) === '\n') {
      return;
    }
    setEmail(text);
    if (verified.current && !validateEmail(text)) {
      setShowError(true);
      return
    }
    setShowError(false);
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateText = (text) => {
    return text?.length >= 2;
  };

  const handleSendFeedback = async () => {
    verified.current = true;
    if (addEmail && !validateEmail(email)) {
      setShowError(true);
      return
    }
    if (!validateText(enteredText)) {
      setShowTextError(true);
      return;
    }
    // reset state
    setShowError(false);
    setEnteredText(null);
    setEmail(null);
    verified.current = false;
    // show thankyou
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowThankYou(true);
    setTimeout(() => {
      onFinished();
    }, 3000);
    // send feedback
    setLoading(true);
    if (brand) {
      await dispatch(sendBrandFeedback({ brandId: brand.id, text: enteredText, email: addEmail ? email : null }));
    } else {
      await dispatch(sendFeedback({ text: enteredText, email })).unwrap();
    }
    onSent();
  }

  const toggleEmail = useCallback((value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAddEmail(value);
    if (!value) {
      setEmail(null);
      verified.current = false;
    }
  });

  if (showThankYou) {
    return (
      <View className="relative flex-1 justify-center items-center h-full px-7 pt-4">
        <Text className="font-montserrat-alt-bold text-3xl pb-20">{t("letsTalk.connect.thankYou")}</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="relative flex-1 justify-center items-stretch h-full">
        <View>
          <Text className="font-montserrat-alt-bold text-2xl">{t("letsTalk.connect.question")}</Text>
        </View>
        {insideBottomSheet ? (
          <BottomSheetTextInput
            className={`rounded-lg h-32 p-6 font-inter-light mt-8 border ${showTextError ? 'border-red' : 'border-blue-600'}`}
            value={enteredText}
            onChangeText={handleTextChange}
            placeholder={t("letsTalk.connect.feedbackPlaceholder")}
            multiline={true}
          />
        ) : (
          <TextInput
            className={`rounded-lg h-32 p-6 font-inter-light mt-8 border ${showTextError ? 'border-red' : 'border-blue-600'}`}
            value={enteredText}
            onChangeText={handleTextChange}
            placeholder={t("letsTalk.connect.feedbackPlaceholder")}
            multiline={true}
          />
        )}
        <View className="flex-row items-center mt-8">
          <Checkbox value={addEmail} onChange={toggleEmail} />
          <Text className="font-inter-light ml-3">{t("letsTalk.connect.addEmail")}</Text>
        </View>
        {addEmail && insideBottomSheet && (
          <BottomSheetTextInput
            className={`rounded-lg px-6 py-4 font-inter-light mt-8 bg-gray border ${showEmailError ? 'border-red' : 'border-transparent'}`}
            value={email}
            autoCapitalize="none"
            onChangeText={handleEmailTextChange}
            placeholder={t("letsTalk.connect.emailPlaceholder")}
            returnKeyType="done"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                Keyboard.dismiss();
              }
            }}
          />
        )}
        {addEmail && !insideBottomSheet && (
          <TextInput
            className={`rounded-lg px-6 py-4 font-inter-light mt-8 bg-gray border ${showEmailError ? 'border-red' : 'border-transparent'}`}
            value={email}
            autoCapitalize="none"
            onChangeText={handleEmailTextChange}
            placeholder={t("letsTalk.connect.emailPlaceholder")}
            returnKeyType="done"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                Keyboard.dismiss();
              }
            }}
          />
        )}
        <Button
          className="mt-8"
          color="pink"
          onPress={handleSendFeedback}
          loading={loading}
          big
        >
          <Text className="font-montserrat-alt-bold text-ledge-pink">
            {t("letsTalk.connect.send")}
          </Text>
        </Button>
      </View>

    </TouchableWithoutFeedback>
  );
}

export default Feedback;
