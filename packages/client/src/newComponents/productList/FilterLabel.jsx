import React, { useCallback } from 'react';
import { View, TouchableHighlight, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

function Badge({
  title,
  Icon,
  onPress = () => {},
  disabled = false,
  selected = false
}) {

  let underlayColor = "#262C3099";

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress(title);
  }, [onPress]);

  return (
    <TouchableHighlight
      onPress={!disabled? (handlePress) : (() => {})}
      disabled={disabled}
      underlayColor={underlayColor}
      className="rounded-lg"
    >
      <View
        className={`
          ${selected ? 'bg-gray-dark' : 'bg-gray'} rounded-lg px-4 py-2
          ${disabled? 'opacity-50' : ''} flex flex-row gap-2
        `}
      >
        {title && <Text className={`${selected ? 'text-white' : 'text-black'}`}>{ title }</Text>}
        {Icon && <Icon style={{ height: '100%' }} />}
      </View>
    </TouchableHighlight>
  );
}

export default Badge;
