import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import QuestionHeader from '../QuestionHeader';
import QuestionOption from '../QuestionOption';
import { useTranslation } from '../../../hooks/useTranslation';

const SingleSelectQuestion = ({
  question,
  answer,
  onAnswersChange,
  hideTitles,
  noScroll,
  forceListLayout,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState(
    answer?.optionId || null,
  );
  const { locale } = useTranslation();
  const hasCorrectAnswer = useMemo(() => !!question.correctAnswerId, [question]);
  const [isCorrect, setIsCorrect] = useState(false);
  const oddOptionsAmount = question.options.length % 2 !== 0;
  const [optionLength, setOptionLength] = useState(oddOptionsAmount || forceListLayout ? 'long' : 'short');

  useEffect(() => {
    setIsCorrect(false);
    setSelectedOptionId(answer?.optionId || null);
  }, [question.question]);

  useEffect(() => {
    if (
      answer &&
      question.options.some((option) => option.id === answer.optionId)
    ) {
      setSelectedOptionId(answer.optionId);
    }
  }, [answer, question.options]);

  const handleSelectOption = (optionId) => {
    const selectedOption = question.options.find(
      (option) => option.id === optionId,
    );
    setSelectedOptionId(optionId);
    onAnswersChange({ value: selectedOption.text[locale], optionId });
  };

  return (
    <ScrollView
      className="h-full"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!noScroll}
    >
      {!hideTitles && (
        <QuestionHeader question={question} subtitleBolder />
      )}
      <View className="pt-8 flex-1 flex-col justify-center">
        <View style={{
          flexDirection: optionLength === 'long' ? 'column' : 'row',
          flexWrap: optionLength === 'long' ? 'nowrap' : 'wrap',
          justifyContent: 'center',
          gap: 8,
        }}>
          {question.options.map((option, index) => {
            console.log('Original option:', option);
            console.log('Text for current locale:', option.text[locale]);
            console.log('Transformed option:', { ...option, [locale]: option.text[locale] });
            return (
              <QuestionOption
                key={option.id}
                option={{ ...option, [locale]: option.text[locale] }}
                onSelect={() => handleSelectOption(option.id)}
                selected={selectedOptionId === option.id}
                className={`${option.image ? 'h-40' : 'h-auto'}`}
                style={{
                  width: optionLength === 'long' ? '100%' : '48%'
                }}
                isCheckbox={true}
                isCorrect={question.correctAnswerId ? (option.id === question.correctAnswerId) : null}
                onTextWrap={() => setOptionLength('long')}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default SingleSelectQuestion;
