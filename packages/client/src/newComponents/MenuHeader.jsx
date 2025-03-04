import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CaretLeftBlue from '../assets/svg/caret-left-blue.svg';
import { useNavigation } from '@react-navigation/native';

const MenuHeader = ({ name, onBack }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row justify-between items-center pb-5 pt-3">
      <TouchableOpacity onPress={handleBack}>
        <CaretLeftBlue className="w-10 h-10" />
      </TouchableOpacity>
      <View>
        <Text className="font-semibold text-lg">{name}</Text>
      </View>
      {/* empty view to keep the right side of the header aligned */}
      <View className="w-10 h-10"></View>
    </View>
  );
};

export default MenuHeader;
