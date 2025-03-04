import React, { useCallback } from 'react';
import { View, TouchableHighlight, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

function Badge({ title, onPress, disabled = false, selected = false}) {

  let underlayColor = "#262C3099";

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <TouchableHighlight
      onPress={!disabled? (handlePress) : (() => {})}
      disabled={disabled}
      underlayColor={underlayColor}
      className="rounded-xl"
    >
      <View
        className={`border border-[0.4px] ${selected ? 'bg-blue-light border-blue' : 'bg-gray border-transparent'} rounded-xl px-4 py-2 ${disabled? 'opacity-50' : ''}`}
      >
        <Text>{ title }</Text>
      </View>
    </TouchableHighlight>
  );
}

export default Badge;
