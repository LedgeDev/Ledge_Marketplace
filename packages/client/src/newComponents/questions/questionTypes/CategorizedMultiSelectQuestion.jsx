import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../../hooks/useTranslation';
import QuestionHeader from '../../../components/questions/QuestionHeader';

const CategorizedQuestionOption = ({
  option,
  onSelect,
  selected,
  className,
  style,
  centerText
}) => {
  const { locale } = useTranslation();

  const optionClass = selected
    ? 'border-blue-300 bg-blue-100'
    : 'border-gray-300 bg-cream';

  const handlePress = () => {
    Haptics.selectionAsync();
    onSelect();
  };

  const textComponent = () => {
    const optionText = option?.[locale]?.toString() || '';
    if (!optionText) return '';

    const splitText = optionText.split('**');
    return (
      <Text
        className={`font-inter-light text-md text-ledge-black ${centerText ? 'text-center' : ''}`}
        maxFontSizeMultiplier={1.5}
      >
        {splitText.map((text, i) => (
          i % 2 === 0 ? (
            <Text key={i}>{text}</Text>
          ) : (
            <Text key={i} className="font-montserrat-alt-bold text-smedium text-ledge-black">
              {text}
            </Text>
          )
        ))}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`rounded-xl border border-1 overflow-hidden ${optionClass} p-4 flex flex-row items-center flex-shrink-0 ${className}`}
      style={style}
    >
      {textComponent()}
    </TouchableOpacity>
  );
};

const CategorizedMultiSelectQuestion = ({ question, answer, onAnswersChange, noScroll }) => {
  const { locale } = useTranslation();
  const [selectedOptions, setSelectedOptions] = useState(answer?.optionIds || []);
  const [optionWidths, setOptionWidths] = useState({});  // Track which options need full width

  useEffect(() => {
    if (answer && answer.optionIds) {
      setSelectedOptions(answer.optionIds.filter(id =>
        question.options.some(category =>
          category.options.some(option => option.id === id)
        )
      ));
    }
  }, [answer, question.options]);

  const handleSelectOption = (optionId) => {
    let newSelectedOptions;
    if (selectedOptions.includes(optionId)) {
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
    } else {
      if (question.maxOptions && selectedOptions.length >= question.maxOptions) {
        // replace last option
        newSelectedOptions = [...selectedOptions.slice(0, selectedOptions.length - 1), optionId];
      } else {
        newSelectedOptions = [...selectedOptions, optionId];
      }
    }
    setSelectedOptions(newSelectedOptions);

    const selectedValues = newSelectedOptions.map(id => {
      let selectedOption;
      question.options.forEach(category => {
        const option = category.options.find(opt => opt.id === id);
        if (option) selectedOption = option;
      });
      return selectedOption[locale];
    });

    onAnswersChange({ value: selectedValues, optionIds: newSelectedOptions });
  };

  const handleTextWrap = (optionId, hasWrapped) => {
    setOptionWidths(prev => ({
      ...prev,
      [optionId]: hasWrapped
    }));
  };

  return (
    <ScrollView
      className="h-full"
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEnabled={!noScroll}
    >
      <QuestionHeader question={question} />
      <View className="pt-8 flex-1">
        {question.options.map((category) => (
          <View key={category.category[locale]} className="mb-6">
            <Text className="text-blue font-montserrat-alt-semi-bold text-lg mb-3">
              {category.category[locale]}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {category.options.map((option) => (
                <CategorizedQuestionOption
                  key={option.id}
                  option={option}
                  onSelect={() => handleSelectOption(option.id)}
                  selected={selectedOptions.includes(option.id)}
                  className="flex-grow-0"
                  style={{ minWidth: 'auto' }}
                  centerText={true}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default CategorizedMultiSelectQuestion;
