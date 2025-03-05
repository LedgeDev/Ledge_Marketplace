import React, { useCallback } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const FilterOption = ({ name, selected, onPress, Icon, indicator = null, disableHapticFeedback = false }) => {
  const handlePress = useCallback(() => {
    if (!disableHapticFeedback) {
      Haptics.selectionAsync();
    }
    onPress(name);
  }, [onPress, name, disableHapticFeedback]);

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4"
      onPress={handlePress}
    >
        <Text className="text-md font-inter-light">{name}</Text>
      <View className="flex-row items-center gap-2">
        { indicator && <Text className="text-sm font-inter-light text-gray-dark">{indicator}</Text> }
        { Icon ? (
          <Icon />
        ) : (
          <View className="w-5 h-5 rounded-full border border-gray-dark justify-center items-center p-0.5">
            { selected && <View className="w-full h-full rounded-full bg-gray-dark" /> }
          </View>
        ) }
      </View>
    </TouchableOpacity>
  )
}

export default FilterOption;