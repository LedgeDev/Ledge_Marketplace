import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import { useExternalUrl } from '../../../hooks/useExternalUrl';
import ScreenWrapper from '../../../components/ScreenWrapper';
import InfoGrayIcon from '../../../assets/svg/info-gray.svg';
import ProgressPicture from '../../../components/ProgressPicture';

const PitchQuestionsThanks = ({ img, t }) => {
  const { openExternalUrl } = useExternalUrl();

  return (
    <ScreenWrapper>
      <View className="flex-1 h-full items-center justify-center gap-14 px-7">
        <ProgressPicture
          size={120}
          strokeWidth={7}
          progress={100}
          imageUrl={img}
        />
        <View>
          <Text className="font-montserrat-alt-bold text-ledge-black text-2xl text-center mb-1">
            {t('pitch.thankYou.title')}
          </Text>
          <Text className="font-montserrat-alt text-ledge-black text-sm text-center mb-10">
          {t('pitch.thankYou.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          className="flex flex-col items-center"
          onPress={() => openExternalUrl('https://www.ledge.eu/your-data')}
        >
          <InfoGrayIcon style={{ opacity: 0.8 }} />
          <Text
            className="font-inter text-ledge-black text-xs text-center mt-2 max-w-[80%]"
            style={{ opacity: 0.3 }}
          >
            {t('pitch.thankYou.learn')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

export default PitchQuestionsThanks;
