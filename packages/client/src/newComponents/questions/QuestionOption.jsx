import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../hooks/useTranslation';
import ExtImage from '../ExtImage';
import CircleOutlineBlue from '../../assets/svg/circle-outline-blue.svg';
import CheckCircleBlue from '../../assets/svg/check-circle-blue.svg';
import CircleFilledGreen from '../../assets/svg/circle-filled-green.svg';
import CircleFilledRed from '../../assets/svg/circle-filled-red.svg';
import BurgerMenuIcon from '../../assets/svg/burgerMenu.svg';

function QuestionOption({ 
  option, 
  onSelect = () => {}, 
  selected, 
  isCheckbox, 
  drag, 
  isActive, 
  className, 
  isCorrect = null, 
  centerText, 
  customIndicator = null,
  style,
  onTextWrap = () => {},
}) {
  const { locale } = useTranslation();

  const optionClass = useMemo(() => {
    if (selected) {
      if (isCorrect === true) {
        return 'border-correct bg-blue-100';
      } else if (isCorrect === false) {
        return 'border-incorrect bg-blue-100';
      } else {
        return 'border-blue-300 bg-blue-100';
      }
    } else {
      return 'border-transparent bg-gray';
    }
  }, [isCorrect, option, selected]);

  const selectedClass = useMemo(() => {
    if (selected) {
      if (isCorrect === true) {
        return 'text-correct';
      } else if (isCorrect === false) {
        return 'text-incorrect';
      }
    }
    return 'text-ledge-black';
  }, [isCorrect, option, selected]);

  const textComponent = useCallback(() => {
    const res = [];
    const optionText = option?.[locale]?.toString() || '';
    if (!optionText) {
      return '';
    }
    const splitText = optionText.split('**');
    let bold = false;
    for (let i = 0; i < splitText.length; i++) {
      if (bold) {
        res.push(
          <Text key={i} className="font-montserrat-alt-bold text-smedium text-ledge-black">
            {splitText[i]}
          </Text>
        );
      } else {
        res.push(
          <Text key={i}>
            {splitText[i]}
          </Text>
        );
      }
      bold = !bold;
    }

    return (
      <Text
        className={`flex-1 leading-5 font-inter-light text-md ${selectedClass} ${centerText ? 'text-center' : ''}`}
        maxFontSizeMultiplier={1.5}
        onTextLayout={handleTextLayout}
      >
        {res}
      </Text>
    );
  }, [option, selected, selectedClass, centerText, locale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onSelect();
  }, [onSelect]);

  const handleTextLayout = (event) => {
    if (event.nativeEvent.lines.length > 1) {
      onTextWrap();
    }
  };

  if (option.image) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className={`
          relative rounded-2xl overflow-hidden border border-1
          ${optionClass} flex justify-start items-center ${className}
        `}
        style={style}
      >
        { isCheckbox && (
          <View className="absolute top-2 left-2 h-[26] w-[26] rounded-full bg-white flex justify-center items-center">
            {isCorrect !== null ? (
            <>
              {selected ? (
                isCorrect ? (
                  <CircleFilledGreen height={27} width={27} />
                ) : (
                  <CircleFilledRed height={27} width={27} />
                )
              ) : (
                <></>
              )}
            </>
          ) : (
            <>
              {selected ? (
                <CheckCircleBlue height={27} width={27} />
              ) : (
                <></>
              )}
            </>
          )}
          </View>
        )}
        { drag && (
          <View className="absolute top-2 left-2 h-[26] w-[26] rounded-full bg-white flex justify-center items-center">
            {selected && (
              <BurgerMenuIcon height={27} width={27} />
            )}
          </View>
        )}
        { customIndicator !== null && (
          <View className="absolute top-2 left-2 h-[26] w-[26] rounded-full bg-white flex justify-center items-center">
            {selected && (
              <View className="rounded-full bg-blue h-[22] w-[22] flex justify-center items-center">
                <Text className="text-white font-montserrat-alt-bold text-sm text-center">
                  {customIndicator}
                </Text>
              </View>
            )}
          </View>
        )}
        <ExtImage
          mediaSource={option.image}
          resizeMode="cover"
          style={{ width: '100%', height: '100%', zIndex: -1
           }}
        />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`
        rounded-xl border border-1 overflow-hidden ${optionClass}
        p-4 flex flex-row justify-start items-center ${className} flex-nowrap
      `}
      onPressIn={drag}
      disabled={isActive}
      style={style}
    >
      { isCheckbox && (
        <View className="mr-4 h-8 w-8">
          {isCorrect !== null ? (
            <>
              {selected ? (
                isCorrect ? (
                  <CircleFilledGreen />
                ) : (
                  <CircleFilledRed />
                )
              ) : (
                <CircleOutlineBlue />
              )}
            </>
          ) : (
            <>
              {selected ? (
                <CheckCircleBlue />
              ) : (
                <CircleOutlineBlue />
              )}
            </>
          )}
        </View>
      )}
      { drag && (
        <View className="mr-4 h-8 w-8">
          <BurgerMenuIcon />
        </View>
      )}
      { textComponent() }
    </TouchableOpacity>
  );
}

export default QuestionOption;