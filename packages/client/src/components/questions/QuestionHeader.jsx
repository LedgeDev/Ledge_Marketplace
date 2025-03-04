import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import ExtImage from '../ExtImage';

function QuestionHeader({ question, subtitleBolder }) {
  const { locale } = useTranslation();

  return (
    <TouchableWithoutFeedback>
    <View>
      {question.displayImage && (
        <ExtImage
          mediaSource={question.displayImage}
          className="w-full h-40 rounded-2xl self-center my-4"
          quality="original"
        />
      )}
      {question.footnote?.en?.length > 0 && (
        <Text className="font-inter-light text-ledge-black opacity-50 text-sm">
          {question.footnote[locale]}
        </Text>
      )}
      <Text maxFontSizeMultiplier={1.7} className="font-montserrat-alt-bold text-ledge-black text-2xl">{question.question[locale]}</Text>
      {question.subtitle?.en?.length > 0 && (
        <Text className={`font-inter-light text-ledge-black ${subtitleBolder ? '' : 'opacity-70'} text-base`}>
          {question.subtitle[locale]}
        </Text>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
};

export default QuestionHeader;