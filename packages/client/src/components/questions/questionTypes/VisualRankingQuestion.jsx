import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import QuestionHeader from '../QuestionHeader';
import QuestionOption from '../QuestionOption';

const VisualRankingQuestion = ({
  question,
  answer,
  onAnswersChange,
  noScroll,
}) => {
  // Calculate the min between the number of options and 3
  const optionsCount = Math.min(question.options.length, 3);
  const initialState = Object.fromEntries(
    Array.from(
      { length: optionsCount },
      (_, index) => [index + 1, ""]
    )
  );
  const [selectedOptions, setSelectedOptions] = useState(answer || initialState);

  useEffect(() => {
    if (answer && JSON.stringify(answer) !== JSON.stringify(selectedOptions)) {
      setSelectedOptions(answer);
    }
  }, [answer]);

  const handleSelectOption = useCallback((optionId) => {
    setSelectedOptions((prevSelectedOptions) => {
      const newSelected = { ...prevSelectedOptions };
      const currentIndex = Object.values(newSelected).indexOf(optionId);
      if (currentIndex !== -1) {
        // If the option is already selected, remove it and all subsequent selections
        for (let i = currentIndex + 1; i <= optionsCount; i++) {
          newSelected[i] = "";
        }
      } else {
        // Add the new selection to the first empty slot
        for (let i = 1; i <= optionsCount; i++) {
          if (newSelected[i] === "") {
            newSelected[i] = optionId;
            break;
          }
        }
      }
      return newSelected;
    });
  }, [optionsCount]);

  const updateAnswersToParent = useCallback((newSelectedOptions) => {
    onAnswersChange(newSelectedOptions);
  }, [onAnswersChange]);
  
  useEffect(() => {
    if (
      JSON.stringify(selectedOptions) !== JSON.stringify(answer) &&
      JSON.stringify(selectedOptions) !== JSON.stringify(initialState)
    ) {
      updateAnswersToParent(selectedOptions);
    }
  }, [selectedOptions]);

  const getOptionWidth = (index) => {
    const optionCount = question.options.length;
    if ((optionCount === 3 || optionCount === 5) && index === optionCount - 1) {
      return 'w-full';
    } else if (optionCount < 4) {
      return 'w-full';
    }
    return 'w-[49%]';
  };

  const getOptionHeight = (index) => {
    const optionCount = question.options.length;
    if (optionCount === 6 || optionCount === 5) {
      return 'h-[28%]';
    } else if (optionCount === 4 || optionCount === 2) {
      return 'h-[43%]';
    } else if (optionCount === 3) {
      return 'h-[28%]';
    }
    return 'h-[43%]';
  };

  return (
    <View className="flex-1 flex-col">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!noScroll}
      >
        <QuestionHeader question={question} />
        <View className="pt-8 flex-grow flex-row flex-wrap justify-between">
          {question.options.map((option, index) => {
            const rank = Object.entries(selectedOptions).find(([_, value]) => value === option.id)?.[0];
            const isSelected = rank !== undefined;
            return (
              <QuestionOption
                key={option.id}
                option={option}
                onSelect={() => handleSelectOption(option.id)}
                selected={isSelected}
                className={`${getOptionWidth(index)} ${getOptionHeight(index)} mb-2 min-h-40`}
                customIndicator={rank}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default VisualRankingQuestion;
