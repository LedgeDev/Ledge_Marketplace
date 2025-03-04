import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import ExtImage from '../../../../components/ExtImage';


function ProductBox({ product, unlocked, handleProductPress }) {
  return (
    <TouchableOpacity
      className="flex-1 w-full rounded-2xl justify-center items-center"
      onPress={() => handleProductPress(product)}
    >
      <View className="flex-1 w-full justify-start items-start">
        {unlocked && product.deal ? (
          <View
            className="z-10 flex-1 h-8 absolute top-2 left-2 rounded-full justify-center items-center px-2 py-1 bg-pink-light"
          >
            <Text className="font-montserrat-alt-bold text-pink-dark text-s">{product.deal}</Text>
          </View>
        ) : null}
        <View className="flex-1 w-full">
          { product?.images?.length > 0 && (
            <ExtImage
              className="w-full h-full rounded-2xl border border-gray-600 border-[0.3px]"
              mediaSource={product.images[0]}
              quality="medium"
              resizeMode="cover"
            />
          )}
        </View>
        <Text
          className="font-montserrat-alt-bold text-ellipsis text-s mt-2"
          numberOfLines={1}
        >
          {product.name}
        </Text>

        {unlocked && product.deal ? (
          <View className="flex-row items-center gap-2">
            <Text
              className="font-montserrat-alt-bold text-pink-dark"
            >
              €{product.dealPrice}
            </Text>
            <Text
              className="font-montserrat-alt-normal text-black-600 line-through"
            >
              €{product.regularPrice}
            </Text>
          </View>
        ) : (
          <Text
            className="font-montserrat-alt-normal"
          >
            €{product.regularPrice}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ProductBox;