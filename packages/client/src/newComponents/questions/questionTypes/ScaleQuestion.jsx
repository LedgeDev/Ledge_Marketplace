import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import mediaUrl from '../../../utils/media-url';
import { useTranslation } from '../../../hooks/useTranslation';
import QuestionOption from '../QuestionOption';
import QuestionHeader from '../QuestionHeader';

const ScaleQuestion = ({ question, answer, onAnswersChange }) => {
  const { locale } = useTranslation();
  const [selectedOptionId, setSelectedOptionId] = useState(answer?.value || null);
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      if (question.displayImage) {
        const uri = await mediaUrl(question.displayImage);
        setImageUri(uri);
      }
    };
    loadImage();
  }, [question.displayImage]);

  useEffect(() => {
    if (answer && answer.value) {
      setSelectedOptionId(answer.value);
    }
  }, [answer]);

  const handleSelectOption = (optionId) => {
    setSelectedOptionId(optionId);
    onAnswersChange({ value: optionId });
  };

  const options = [1, 2, 3, 4, 5];

  return (
    <View className="flex-1">
      <QuestionHeader question={question} />
      <View className="grow flex flex-col justify-center items-stretch">
        <View className="flex flex-row justify-between items-center mb-4">
          <Text className="text-gray-600 text-sm">
            {question.scaleBottomLabel ? question.scaleBottomLabel[locale] : 'Terrible'}
          </Text>
          <Text className="text-gray-600 text-sm">
          {question.scaleTopLabel ? question.scaleTopLabel[locale] : 'Excellent'}
          </Text>
        </View>
        <View className="flex flex-row justify-between items-center">
          {options.map((option) => (
            <QuestionOption
              key={option}
              option={{ id: option, [locale]: option }}
              onSelect={() => handleSelectOption(option)}
              selected={selectedOptionId === option}
              className="shrink w-[60] h-[60] mx-0.5 rounded-xl flex justify-center items-center"
              centerText
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default ScaleQuestion;
