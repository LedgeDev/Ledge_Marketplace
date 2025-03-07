import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import ExtImage from '../../newComponents/ExtImage';

const Offer = ({ offer, onAccept = () => {} }) => {
  const user = useSelector((state) => state.users.data);
  const date = new Date(offer.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleAccept = () => {
    onAccept(offer);
  };

  return (
    <View className="relative bg-gray rounded-lg p-4 flex flex-row gap-4 items-stretch">
      <Text className="absolute top-4 right-4 font-inter-regular text-sm text-black-600">
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
      { offer.product.userId === user.id && offer.status === 'pending' && (
        <TouchableOpacity
          onPress={handleAccept}
          className="absolute bottom-4 right-4 h-14 w-24 bg-green-light rounded-xl flex justify-center items-center"
        >
          <Text className="font-inter text-black text-md">Accept</Text>
        </TouchableOpacity>
      )}
      { offer.product.userId === user.id && offer.status === 'accepted' && (
        <TouchableOpacity
          onPress={handleAccept}
          className="absolute bottom-4 right-4 h-14 w-24 bg-black-600 rounded-xl flex justify-center items-center"
          disabled
        >
          <Text className="font-inter text-white text-md">Accepted</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Offer;
