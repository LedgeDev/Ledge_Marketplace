import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import QuestionHeader from '../QuestionHeader';

const LocationQuestion = ({ question, answer, onAnswersChange }) => {
  const [inputText, setInputText] = useState(answer || '');
  const placesRef = useRef(null);

  const translateYAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        Animated.timing(translateYAnim, {
          toValue: -180,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(translateYAnim, {
          toValue: -60,
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    setInputText(answer || '');
  }, [answer]);

  const handleLocationSelect = (data, details) => {
    const description = data.description;
    setInputText(description);
    onAnswersChange(description);

    if (placesRef.current) {
      placesRef.current.setAddressText(description);
    }
  };

  return (
    <View className="h-full">
      <QuestionHeader question={question} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 flex flex-col justify-center items-stretch"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ transform: [{ translateY: translateYAnim }] }}
          keyboardShouldPersistTaps="handled"
        >
          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="Type your location"
            onPress={(data, details = null) => {
              Keyboard.dismiss();
              handleLocationSelect(data, details);
            }}
            listViewDisplayed={false}
            query={{
              key: process.env.GOOGLE_MAPS_API_KEY,
              language: 'en',
              types: '(cities)',
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            styles={{
              container: {
                marginTop: 0,
              },
              listView: {
                borderWidth: 0,
                borderColor: 'transparent',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                marginTop: 10,
                position: 'absolute',
                top: 50,
                left: 0,
                right: 0,
                zIndex: 2,
              },
              row: {
                padding: 13,
                height: 44,
                flexDirection: 'row',
              },
              separator: {
                height: 1,
                backgroundColor: '#e5e7eb',
              },
            }}
            textInputProps={{
              className: "border border-blue-600 rounded-lg h-16 px-6 font-inter-light text-base",
              value: inputText,
              onChangeText: (text) => { setInputText(text); },
              multiline: false,
              underlineColorAndroid: 'transparent',
              autoFocus: true
            }}
            onFail={(error) => console.error('Places API Error:', error)}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LocationQuestion;
