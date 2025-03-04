import React, { useEffect, useState } from 'react';
import { View, Text, TouchableHighlight, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from "@react-navigation/native";
import NewDotIndicator from './NewDotIndicator';
import CaretRightWhite from '../assets/svg/caret-right-white.svg';
import levelColors from '../utils/level-colors';
import CheckColor from '../assets/svg/check-color.svg';

function QuestionnaireButton({ subCategory = null, showDotIndicator = false, onNavigate = () => {} }) {
  const navigation = useNavigation();
  const questionnaire = useSelector((state) => state.questionnaires.questionnaire);
  const [answeredQuestions, setAnsweredQuestions] = useState(questionnaire?.questions.filter(q => q.answers.length) || []);
  const [notAnsweredQuestions, setNotAnsweredQuestions] = useState(questionnaire?.questions.filter(q => !q.answers.length) || []);
  const [questionnaireClassesTexts, setQuestionnaireClassesTexts] = useState('');
  const [levelColor, setLevelColor] = useState({});

  useEffect(() => {
    if (questionnaire) {
      const newAnsweredQuestions = questionnaire.questions.filter(q => q.answers.length);
      const newNotAnsweredQuestions = questionnaire.questions.filter(q => !q.answers.length);
      setAnsweredQuestions(newAnsweredQuestions);
      setNotAnsweredQuestions(newNotAnsweredQuestions);

      let questionnaireClasses = Array.from(new Set(newNotAnsweredQuestions.map(q => q.questionClass? q.questionClass.name : '').flat()));
      // remove classes with empty strings
      questionnaireClasses = questionnaireClasses.filter(c => c.length > 0);
      if (questionnaireClasses.length > 3) {
        questionnaireClasses = questionnaireClasses.slice(0, 3);
        questionnaireClasses.push('& more');
      }
      setQuestionnaireClassesTexts(questionnaireClasses.join(', '));
      setLevelColor(levelColors(questionnaire.level.order));
    }
  }, [questionnaire]);

  const handlePress = () => {
    onNavigate();
    if (answeredQuestions.length === questionnaire.questions.length) {
      navigation.navigate("Answers", { id: questionnaire.id, sort: 'questionnaire', menuName: questionnaire.name })
    } else {
      navigation.navigate('Questionnaire', { subCategory, menuHeader: true, welcome: false });
    }
  };

  if (!questionnaire) {
    return (
      <View className="py-3 px-6 flex flex-row justify-center items-center">
        <ActivityIndicator color="#999999" />
      </View>
    );
  }

  return (
    <TouchableHighlight
      underlayColor={'6F71B1'}
      activeOpacity={0.5}
      className="rounded-2xl"
      style={{ backgroundColor: levelColor.dark }}
      onPress={handlePress}
    >
      <View className="py-3 px-6 flex flex-row justify-between items-center">
        <View className="grow-0 w-[75%]">
          <View className="flex flex-row items-center">
            <Text maxFontSizeMultiplier={1.5} className="font-montserrat-alt-bold text-white text-xl">{ questionnaire.name }</Text>
            <NewDotIndicator className="mx-2" show={showDotIndicator} />
          </View>
          <Text maxFontSizeMultiplier={1.5} className="text-white opacity-60" numberOfLines={1}>{ questionnaireClassesTexts }</Text>
        </View>
        <View className="flex flex-row items-center">
          {answeredQuestions.length === questionnaire.questions.length && (
            <View className="rounded-full mr-2 h-8 w-8 px-2 bg-white flex justify-center items-center">
              <CheckColor style={{ color: levelColor.dark }} />
            </View>
          )}
          {answeredQuestions.length !== questionnaire.questions.length && (
            <View className="rounded-full mr-2 h-7 px-2 bg-white flex justify-center items-center">
              <Text className="tracking-widest font-light" style={{ color: levelColor.dark }}>
                {answeredQuestions.length}/{questionnaire.questions.length}
              </Text>
            </View>
          )}
          {answeredQuestions.length !== questionnaire.questions.length && (
            <CaretRightWhite />
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
}

export default QuestionnaireButton;