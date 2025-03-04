import React from 'react';
import { View, Text } from 'react-native';

const Divider = ({ title }) => {
  return (
    <View className="mt-8 mb-6 flex-row items-center self-center px-4 w-full">
      <Text
      className="font-montserrat-alt-bold text-2xl">{title}</Text>
    </View>
  );
};
export default Divider;
