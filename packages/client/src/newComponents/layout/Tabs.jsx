import React, { useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, interpolateColor, useSharedValue, withTiming } from 'react-native-reanimated';

const Tabs = ({ 
  tabNames = [], 
  onTabSelection = () => {}, 
  selectedTab, 
  transitionToFullscreen = useSharedValue(0), // used for background opacity and text color (shared value)
}) => {

  const textColorStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        transitionToFullscreen.value,
        [0, 1],
        ['black', 'white']
      ),
    };
  });

  return (
    <View className="relative rounded-full">
      <Animated.View
        className="absolute w-full h-full rounded-full overflow-hidden"
        style={{
          opacity: transitionToFullscreen,
        }}
      >
        <View className="absolute w-full h-full bg-black opacity-25"/>
        <BlurView
          className="absolute w-full h-full"
          intensity={10}
          tint="dark"
        />
        <View className="absolute w-full h-full bg-black rounded-full opacity-20 border border-grey border-1"/>
      </Animated.View>
      <View className="flex flex-row justify-center py-2 px-4 gap-5">
        {tabNames.map((tabName, index) => (
          <View key={index} className="relative">
            <TouchableOpacity
              onPress={() => onTabSelection(index)}
              className="relative"
            >
              <Animated.Text
                className="text-white text-lg font-montserrat-alt-bold"
                style={[textColorStyle, { opacity: selectedTab === index ? 1 : 0 }]}
              >
                {tabName}
              </Animated.Text>
              <Animated.Text
                className="absolute text-white text-lg font-montserrat-alt"
                style={[textColorStyle, { opacity: selectedTab === index ? 0 : 1 }]}
              >
                {tabName}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Tabs;