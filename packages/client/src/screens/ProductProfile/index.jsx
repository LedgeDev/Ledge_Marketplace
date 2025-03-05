import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import HTMLView from 'react-native-htmlview';
import ExtImage from '../../newComponents/ExtImage';
import Button from '../../newComponents/Button';
import GoBack from '../../assets/svg/goBack.svg';
import Star from '../../assets/svg/star-blue.svg';

const htmlStyles = StyleSheet.create({
  p: {
    textAlign: 'justify',
    marginBottom: 1,
    fontFamily: 'Montserrat-alt',

  },
  strong: {
    fontWeight: 'bold',
    color: '#262C30'
  },
  div: {
    marginBottom: 0,
    marginTop: 0,
  },
  span: {
    marginBottom: 0,
    marginTop: 0,
  }
});

const reviews = [
  {
    id: 1,
    name: 'John Doe',
    rating: 4.5,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: 2,
    name: 'Jane Doe',
    rating: 4.5,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: 3,
    name: 'John Doe',
    rating: 4.5,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
];

const reviewsGap = 16;

const MenuButtons = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      className="absolute top-0 left-0 right-0 bg-transparent z-30 flex flex-row items-center px-6"
      style={{ paddingTop: insets.top }}
    >
      <TouchableOpacity onPress={navigation.goBack}>
        <GoBack width={32} height={32} />
      </TouchableOpacity>
    </View>
  )
}

const ProductProfile = ({ route }) => {
  const { product } = route.params;
  const insets = useSafeAreaInsets();
  const [reviewsWidth, setReviewsWidth] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentReviewIndex(viewableItems[0].index);
    }
  }, []);

  if (!product) {
    return null;
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-cream"
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <ExtImage
          className="w-full h-96"
          mediaSource={product.images[0]}
        />
        <View className="w-full flex justify-center items-center bg-cream" style={{ paddingTop: insets.top, paddingBottom: insets.top }}>
          <Text className="font-montserrat-bold text-3xl">{product.name}</Text>
          <View className="flex flex-row items-center gap-2">
            <Text className="font-montserrat-bold text-md">by</Text>
            <ExtImage
              className="h-10 w-16 bg-transparent"
              resizeMode="contain"
              mediaSource={product.brand.brandLogo}
            />
          </View>
        </View>
        <View className="px-6 flex flex-col gap-4">
          <View className="bg-white rounded-lg p-4 border border-1 border-gray flex flex-col items-center">
            <Text className="font-montserrat-bold text-3xl">€{product.regularPrice}</Text>
            <Text className="font-montserrat-bold text-xl text-pink-dark">€{product.dealPrice}</Text>
            <Text className="font-montserrat-bold text-md text-pink-dark">Lowest offer</Text>
            <Button
              color="blue"
              onPress={() => {}}
              className="w-full mt-4"
            >
              <Text className="font-montserrat-bold text-white text-lg">Make offer</Text>
            </Button>
          </View>
          <View className="bg-white rounded-lg p-4 border border-1 border-gray">
            <HTMLView
              value={product.description.en}
              stylesheet={htmlStyles}
              paragraphBreak={''}
              lineBreak={'\n'}
            />
          </View>
          <View className="w-full" onLayout={(event) => setReviewsWidth(event.nativeEvent.layout.width)}>
            <FlatList
              className="w-full overflow-visible"
              data={reviews}
              ItemSeparatorComponent={() => <View style={{ width: reviewsGap }} />}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={reviewsWidth + reviewsGap}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View className="bg-white rounded-lg p-4 border border-1 border-gray" style={{ width: reviewsWidth }}>
                  <Text className="font-montserrat-bold text-2xl">{item.name}</Text>
                  <View className="flex flex-row items-center gap-1">
                    <Star width={20} height={20} />
                    <Text className="font-montserrat-bold text-xl">{item.rating}</Text>
                  </View>
                  <Text className="font-inter-regular text-lg">{item.content}</Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              getItemLayout={(data, index) => ({
                length: reviewsWidth + reviewsGap,
                offset: (reviewsWidth + reviewsGap) * index,
                index,
              })}
              viewabilityConfig={viewabilityConfig}
              style={{ maxWidth: reviewsWidth }}
              onViewableItemsChanged={onViewableItemsChanged}
            />
          </View>
          <View className="flex flex-row items-center justify-center gap-2">
            {reviews.map((_, index) => (
              <View key={index} className={`w-2 h-2 rounded-full ${index === currentReviewIndex ? 'bg-blue' : 'bg-gray'}`} />
            ))}
          </View>
        </View>
      </ScrollView>
      <MenuButtons />
    </>
  )
}

export default ProductProfile;