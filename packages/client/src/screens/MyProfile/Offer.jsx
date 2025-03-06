import { View, Text } from 'react-native';
import ExtImage from '../../newComponents/ExtImage';

const Offer = ({ offer }) => {
  const date = new Date(offer.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <View className="relative bg-gray rounded-lg p-4 flex flex-row gap-4">
      <Text className="absolute top-4 right-4 font-inter-regular text-md text-black-600">
        {formattedDate}
      </Text>
      <ExtImage
        className="w-20 h-20 rounded-lg"
        mediaSource={offer.product?.images[0]}
      />
      <View className="flex flex-col items-start flex-1">
        <Text className="font-montserrat-bold text-lg">€{offer.amount}</Text>
        <Text className="font-inter text-lg text-pink-dark">{offer.product?.name}</Text>
        <Text className="font-inter text-md">by {offer.product?.brand?.name}</Text>
      </View>
    </View>
  );
};

export default Offer;
