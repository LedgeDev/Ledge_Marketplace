import React from 'react';
import { View, Text } from 'react-native';
import PaperPlane from '../../../assets/svg/paperPlane.svg';
import FullStar from '../../../assets/svg/star-blue.svg';
import EmptyStar from '../../../assets/svg/star-outline-blue.svg';
import Button from '../../../components/Button';
import FounderImages from './FounderImages';

function RatingScreen({ brand, bottomSheetRef, t, unlocked }) {

  const openModal = async () => {
    await bottomSheetRef.current?.show();
  };

  const score = brand.rating ? Math.floor(brand.rating) : 0;

  const renderStars = () => {
    let stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < score) {
        stars.push(<FullStar key={i} height={30} width={30} />);
      } else {
        stars.push(<EmptyStar key={i} height={30} width={30} />);
      }
    }
    return stars;
  };

  return (
    <View className="justify-center items-center px-4 mt-4">
      <View className="w-full justify-center items-start self-center">
        <View className="flex-row mb-4">
          {renderStars()}
        </View>
      </View>
      { unlocked && (
        <>
          <View className="w-32 h-32 my-6">
            <FounderImages brand={brand} />
          </View>
          <Button
            className="mb-12 self-center"
            prependIcon={<PaperPlane width={20} height={20} />}
            onPress={openModal}
            color="pink"
          >
            <Text className="text-md text-ledge-pink">
              {t('brandProfile.dropus')}
            </Text>
          </Button>
        </>
      )}
    </View>
  );
}

export default RatingScreen;
