import React, { useState } from 'react';
import { View, Text, TouchableHighlight, Switch } from 'react-native';
import CaretRightBlue from '../assets/svg/caret-right-blue.svg';

function MenuElement({ title, description, onPress = () => {}, isToggle, toggleValue, toggleDisabled, numberIndicator, disabled }) {

  return (
    <TouchableHighlight
      underlayColor={'#F1F1F1'}
      onPress={onPress}
      disabled={isToggle || disabled}
      style={{ opacity: disabled ? 0.6 : 1}}
    >
      <View className="py-4 px-6 flex flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold">{title}</Text>
          {description && <Text className="text-sm text-gray-600">{description}</Text>}
        </View>
        <View className="flex flex-row items-center">
          {numberIndicator > 0 && (
            <View className="rounded-full mr-2 h-7 w-7 bg-pink-light flex justify-center items-center">
              <Text className="text-pink-dark">{numberIndicator}</Text>
            </View>
          )}
          {isToggle ? (
            <Switch
              className="transform scale-[0.65]"
              style={{ transformOrigin: 'right', opacity: toggleDisabled ? 0.5 : 1 }}
              trackColor={{false: '#F1F1F1', true: '#1C1C1C'}}
              onValueChange={onPress}
              value={toggleValue}
              disabled={toggleDisabled}
            />
          ) : (
            <>
            {!disabled && <CaretRightBlue />}
            </>
          )}
        </View>
      </View>
    </TouchableHighlight>
  );
}

export default MenuElement;