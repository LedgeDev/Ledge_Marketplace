import React, { useState } from 'react';
import { 
  View,
  TextInput, 
  TouchableWithoutFeedback, 
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import QuestionHeader from '../QuestionHeader';

const TextInputQuestion = ({ question, answer, onAnswersChange, insideBottomSheet }) => {
  const [enteredText, setEnteredText] = useState(answer || '');

  const handleTextChange = (text) => {
    // omit if last character is a newline
    if (text.slice(-1) === '\n') {
      return;
    }
    setEnteredText(text);
    onAnswersChange(text);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="h-full">
        <QuestionHeader question={question} />
        { insideBottomSheet ? (
          <BottomSheetTextInput
            maxLength={200}
            className="border border-blue-600 rounded-lg min-h-32 p-6 mt-8 font-inter-light"
            value={enteredText}
            onChangeText={handleTextChange}
            placeholder="Type your answer"
            multiline={true}
            returnKeyType="done"
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                Keyboard.dismiss();
              }
            }}
          />
        ) : (
          <KeyboardAvoidingView behavior="padding" className="flex-1 flex flex-col justify-center items-stretch">
            <TextInput
              maxLength={200}
              className="border border-blue-600 rounded-lg min-h-32 p-6 mt-8 font-inter-light"
              value={enteredText}
              onChangeText={handleTextChange}
              placeholder="Type your answer"
              multiline={true}
              returnKeyType="done"
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter') {
                  Keyboard.dismiss();
                }
              }}
            />
          </KeyboardAvoidingView>
        )}
    </View>
  </TouchableWithoutFeedback>
  );
};

export default TextInputQuestion;
