import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabsHeight, labelsHeight } from '../utils/blur-utils';


function TopBlur({ labels = false, noTranslation = false }) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="absolute top-0 left-0 w-full z-20"
      style={{ 
        height: top + tabsHeight + (labels ? labelsHeight : 0),
        // translation is needed to avoid the blur to show separated from the top of the screen
        transform: [{ translateY: (noTranslation ? 0 : -(top + tabsHeight)) }],
      }}
    >
      <LinearGradient
        colors={['#FCFBF8', '#FCFBF8E6', '#FCFBF8CC', '#FCFBF899', '#FCFBF880', '#FCFBF84D', '#FCFBF800']}
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          zIndex: 20,
        }}
      />
      <BlurView
        className="w-full h-full"
        tint="light"
        intensity={10}
      />
    </View>
  );
}

export default TopBlur;