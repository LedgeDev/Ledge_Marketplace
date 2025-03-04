import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MenuElement from '../../components/MenuElement';
import CaretRightBlue from '../../assets/svg/caret-right-blue.svg';
import { useTranslation } from '../../hooks/useTranslation';

function MyData({ sortedAnswers }) {
  const [sort, setSort] = useState('category');
  const navigation = useNavigation();
  const { t } = useTranslation();

  const setSortWithAnimation = (sort) => {
    // initiate layout animation
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setSort(sort);
  };

  const questionClassDisabled = (questionClass) => {
    if (questionClass.answers?.length > 0 || questionClass.pendingQuestions?.length > 0) {
      return false;
    }
    return true;
  }

  const handleMenuElementPress = (sortType, element) => {
    if (sortType === 'questionClass' && questionClassDisabled(element)) {
      return;
    }
    navigation.navigate("Answers", { id: element.id, sort: sortType, menuName: element.name });
  }

  return (
    <View className="bg-white rounded-2xl mb-24 overflow-hidden">
      <View className="flex flex-row justify-between items-center p-6 flex-wrap">
        <Text maxFontSizeMultiplier={1.5} className="text-2xl font-montserrat-alt-bold">{t('myData.myData')}</Text>
        <View className="flex flex-row gap-2">
          <TouchableOpacity
            className="shrink-0"
            onPress={() => setSortWithAnimation('category')}
          >
            <Text
              className={`text-xs ${sort === 'category' ? 'font-montserrat-alt-bold' : ''}`}
              maxFontSizeMultiplier={1.5}
            >
              {t('extras.byCategory')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="shrink-0"
            onPress={() => setSortWithAnimation('questionnaire')}
          >
            <Text
              className={`text-xs ${sort === 'questionnaire' ? 'font-montserrat-alt-bold' : ''}`}
              maxFontSizeMultiplier={1.5}
            >
              {t('extras.byQuestionnaire')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {!sortedAnswers && (
        <View className="py-4 px-6 flex flex-row justify-between items-center">
          <View>
            <View className="w-20 h-4 bg-gray mb-5"></View>
            <View className="w-10 h-3 bg-gray mb-5"></View>
          </View>
          <View className="flex flex-row items-center">
            <View className="rounded-full mr-2 h-7 w-7 bg-pink-light flex justify-center items-center"></View>
            <CaretRightBlue />
          </View>
        </View>
      )}
      {Array.isArray(sortedAnswers) && sortedAnswers.length < 1 && (
        <View className="py-4 px-6 flex flex-row justify-between items-center">
          <Text>No data available</Text>
        </View>
      )}
      {sortedAnswers?.questionClass && sort === 'category' && (
        <View className="flex flex-col gap-3">
          {sortedAnswers.questionClass.map((questionClass, index) => (
            <MenuElement
              key={index}
              title={questionClass.name}
              description={`${questionClass.answers.length} answers`}
              onPress={() => handleMenuElementPress('questionClass', questionClass)}
              numberIndicator={questionClass.pendingQuestions?.length}
              disabled={questionClassDisabled(questionClass)}
            />
          ))}
        </View>
      )}
      {sortedAnswers?.questionnaire && sort === 'questionnaire' && (
        <View className="flex flex-col gap-3">
          {sortedAnswers.questionnaire.map((questionnaire, index) => (
            <MenuElement
              key={index}
              title={questionnaire.name}
              description={`${questionnaire.answers.length} answers`}
              onPress={() => handleMenuElementPress('questionnaire', questionnaire)}
              numberIndicator={questionnaire.pendingQuestions?.length}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default MyData;
