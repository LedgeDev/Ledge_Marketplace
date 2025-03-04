import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import EventBus from 'react-native-event-bus';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics } from '../../hooks/useAnalytics';
import Play from '../../assets/svg/play-white.svg';
import { BlurView } from 'expo-blur';

const PlayButton = ({ brand, parentTabName }) => {
  const navigation = useNavigation();
  const analytics = useAnalytics();

  const handlePress = () => {
    navigation.navigate('Pitch', { brand: brand });
    analytics.capture("Pitch interaction: initiated", {
      brandId: brand.id,
      brandName: brand.name,
      origin: parentTabName,
    });
    EventBus.getInstance().fireEvent("navigating", { navigate: true });
  };

  return (
    <TouchableOpacity
      className="rounded-full"
      onPress={handlePress}
    >
      <View className="relative w-20 h-20 rounded-full border border-2 border-white justify-center items-center overflow-hidden">
        <View className="absolute w-full h-full bg-black opacity-20"/>
        <BlurView
          intensity={10}
          tint="dark"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="pl-1">
          <Play width={27} height={27} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PlayButton;
