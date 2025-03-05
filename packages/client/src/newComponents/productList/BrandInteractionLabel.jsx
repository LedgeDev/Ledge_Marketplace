import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

import PinkTag from '../../assets/svg/tag-pink.svg';
import PinkTimer from '../../assets/svg/timer-pink.svg';
import MegaphonePink from '../../assets/svg/megaphone-pink.svg';
import StarOutlinePink from '../../assets/svg/star-outline-pink.svg';

const BrandInteractionLabel = ({ label }) => {
  const { t } = useTranslation();
  const textMap = {
   'feedback': t('myBrands.interactionLabels.feedback'),
   'redeem': t('myBrands.interactionLabels.redeem'),
   'update': t('myBrands.interactionLabels.update'),
   'daysLeft': `${label.data} ${t('myBrands.interactionLabels.daysLeft')}`.trim(),
  };
  const iconMap = {
    'feedback': <StarOutlinePink />,
    'redeem': <PinkTag />,
    'update': <MegaphonePink />,
    'daysLeft': <PinkTimer />,
  };
  return (
    <View className="flex-row items-center py-1 px-3 bg-pink-light rounded-full mr-auto">
      <View className="mr-2">
        { iconMap[label.id] }
      </View>
      <Text className="text-ledge-pink typography-footnote-regular">
        { textMap[label.id] }
      </Text>
    </View>
  );
};

export default BrandInteractionLabel;
