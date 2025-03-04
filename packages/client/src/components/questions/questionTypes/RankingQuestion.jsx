import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist"
import { useTranslation } from '../../../hooks/useTranslation';
import QuestionHeader from '../QuestionHeader';
import QuestionOption from '../QuestionOption';


const RankingQuestion = ({ question, answer, onAnswersChange, isCurrentQuestion = false }) => {
  const { locale } = useTranslation();

  // set initial answer
  let initialOptions = [];
  if (answer && answer.value) {
    initialOptions = answer.value.map(id => question.options.find(option => option.id === id));
  } else {
    initialOptions = question.options
  }

  const [items, setItems] = useState(initialOptions);

  useEffect(() => {
    if (isCurrentQuestion) {
      onAnswersChange({ value: items.map(item => item.id) });
    }
  }, [items, isCurrentQuestion]);

  const renderItem = ({ item, drag, isActive }) => {
    return (
      <ScaleDecorator>
        <QuestionOption
          option={item}
          onSelect={undefined}
          className="w-full h-auto mb-2"
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    );
  }

  return (
    <View className="h-full">
      <View className="z-20">
        <QuestionHeader question={question} />
      </View>
      <View className="pt-8 flex-1 flex-col justify-center">
        <Text className="pt-8 text-gray-600 text-sm mb-3 z-20">
          {question.scaleTopLabel ? question.scaleTopLabel[locale] : 'Most appealing'}
        </Text>
        <View className="overflow-visible z-10">
          <DraggableFlatList
            data={items}
            renderItem={renderItem}
            onDragEnd={({ data }) => setItems(data)}
            keyExtractor={(item) => item.id}
            className="overflow-visible"
            scrollEnabled={true}
            onPlaceholderIndexChange={() => Haptics.selectionAsync(Haptics.ImpactFeedbackStyle.Soft)}
          />
        </View>
        <Text className="text-gray-600 text-sm mt-3 ">
          {question.scaleBottomLabel ? question.scaleBottomLabel[locale] : 'Least appealing'}
        </Text>
      </View>
    </View>
  );
};

export default RankingQuestion;
