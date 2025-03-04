import React, { useLayoutEffect } from 'react';
import { View, LayoutAnimation, Platform } from 'react-native';

const ProgressBar = ({
  totalSteps,
  currentStep,
  showBorder = false,
  horizontal = false,
  bgColor = 'pink',
}) => {

  useLayoutEffect(() => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, [currentStep, totalSteps]);

  if (horizontal) {
    return (
      <View className="w-full h-2 flex flex-row gap-1 items-center">
        { Array.from({ length: totalSteps }, (_, i) => (
          <View 
            key={i}
            className={`rounded-lg ${showBorder ? 'h-1.5 p-[1] bg-blue' : `h-1 bg-${bgColor}`}`}
            style={{
              flexGrow: currentStep === i ? 3 : 1,
              opacity: currentStep === i ? 1 : 0.5,
            }}
          >
            { showBorder && <View className={`h-full w-full rounded-lg bg-${bgColor}}`} /> }
          </View>
        )) }
      </View>
    );
  }
  return (
    <View className="h-full w-2 flex flex-col gap-1 items-center">
      { Array.from({ length: totalSteps }, (_, i) => (
        <View 
          key={i}
          className={`rounded-lg ${showBorder ? 'w-1.5 p-[1] bg-blue' : `w-1 bg-${bgColor}`}`}
          style={{
            flexGrow: currentStep === i ? 3 : 1,
            opacity: currentStep === i ? 1 : 0.5,
          }}
        >
          { showBorder && <View className={`w-full h-full rounded-lg bg-${bgColor}`} /> }
        </View>
      )) }
    </View>
  );
};

export default ProgressBar;
