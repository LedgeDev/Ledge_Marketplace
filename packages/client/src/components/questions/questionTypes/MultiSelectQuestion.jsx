import React, { useState, useEffect } from 'react';
import { View, ScrollView  } from 'react-native';
import { useTranslation } from '../../../hooks/useTranslation';
import QuestionHeader from '../QuestionHeader';
import QuestionOption from '../QuestionOption';

const MultiSelectQuestion = ({ question, answer, onAnswersChange, noScroll }) => {
  const { locale } = useTranslation();
  const [selectedOptions, setSelectedOptions] = useState(answer?.optionIds || []);
  const oddOptionsAmount = question.options.length % 2 !== 0;
  const [optionLength, setOptionLength] = useState(oddOptionsAmount ? 'long' : 'short');

  useEffect(() => {
    if (answer && answer.optionIds) {
      setSelectedOptions(answer.optionIds.filter(id => question.options.some(option => option.id === id)));
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
      const option = question.options.find(opt => opt.id === id);
      return option[locale];
    });

    onAnswersChange({ value: selectedValues, optionIds: newSelectedOptions });
  };

  return (
    <ScrollView
      className="h-full"
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEnabled={!noScroll}
    >
      <QuestionHeader question={question} />
      <View className="pt-8 flex-1 flex-col justify-center">
        <View style={{
          flexDirection: optionLength === 'long' ? 'column' : 'row',
          flexWrap: optionLength === 'long' ? 'nowrap' : 'wrap',
          justifyContent: 'center',
          gap: 8,
        }}>
          {question.options.map((option, index) => {
            return (
              <QuestionOption
                key={option.id}
                option={option}
                onSelect={() => handleSelectOption(option.id)}
                selected={selectedOptions.includes(option.id)}
                className={`${option.image ? 'h-40' : 'h-auto'}`}
                style={{
                  width: optionLength === 'long' ? '100%' : '48%'
                }}
                isCheckbox={option.image ? true : false}
                onTextWrap={() => setOptionLength('long')}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default MultiSelectQuestion;
