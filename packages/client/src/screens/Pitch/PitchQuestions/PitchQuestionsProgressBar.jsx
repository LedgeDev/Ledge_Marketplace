import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CloseIcon from '../../../assets/svg/x-blue.svg';
import ProgressPicture from '../../../components/ProgressPicture';

const PitchQuestionsProgressBar = ({
  totalSteps,
  currentStep,
  brand,
  onClose = () => {},
  t
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center">
        <View className="mr-4">
          <ProgressPicture
            size={55}
            strokeWidth={3}
            progress={progress}
            imageUrl={brand.founders && brand.founders.length > 0 ? brand.founders[0].image : null}
          />
        </View>
        <Text className="font-montserrat-alt-bold text-pink text-md">
          {t('pitch.progressbar.feedbackfor')} {brand.name}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose}>
        <CloseIcon />
      </TouchableOpacity>
    </View>
  );
};

export default PitchQuestionsProgressBar;
