import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getUser } from '../../store/models/users';
import ScreenWrapper from '../../newComponents/layout/ScreenWrapper';
import Offer from './Offer';

function MyProfileScreen({}) {
  const user = useSelector((state) => state.users.data);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser());
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 overflow-visible px-6">
        <View className="flex-col justify-center items-stretch gap-4">
          <View className="bg-white rounded-lg p-4 border border-1 border-gray flex flex-col items-center">
            <Image
              source={require('../../assets/images/user-placeholder.jpg')}
              className="w-24 h-24 rounded-full border border-1 border-gray"
              resizeMode="cover"
            />
            <Text className="font-montserrat-bold text-2xl">{user.name}</Text>
            <View className="w-full pt-4 flex flex-col gap-2">
              <View className="w-40 h-4 bg-gray"/>
              <View className="w-40 h-4 bg-gray"/>
              <View className="w-40 h-4 bg-gray"/>
              <View className="w-40 h-4 bg-gray"/>
            </View>
          </View>

          <View className="bg-white rounded-lg p-4 border border-1 border-gray flex flex-col items-center">
            <Text className="font-montserrat-bold text-2xl">Offers</Text>
            <View className="flex flex-col gap-4 w-full">
              {user.offers.map((offer) => (
                <Offer key={offer.id} offer={offer} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

export default MyProfileScreen;
