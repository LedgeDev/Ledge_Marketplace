import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Image, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { patchOffer } from '../../store/models/offers';
import { getUser } from '../../store/models/users';
import ScreenWrapper from '../../newComponents/layout/ScreenWrapper';
import Offer from './Offer';

function MyProfileScreen({}) {
  const user = useSelector((state) => state.users.data);
  const dispatch = useDispatch();
  const productOffers = useMemo(() => user.products.map((product) => product.offers).flat(), [user.products]);


  useEffect(() => {
    dispatch(getUser());
  }, []);

  useEffect(() => {
    console.log(productOffers);
  }, [productOffers]);

  const handleAcceptOffer = useCallback(async (offer) => {
    console.log('accepting offer', offer.id);
    const res = await dispatch(patchOffer({ id: offer.id, data: { status: 'accepted' } })).unwrap();
    console.log('accepted offer', res.status);
    await dispatch(getUser()).unwrap();
  }, [dispatch]);

  return (
    <>
      <ScreenWrapper>
        <ScrollView className="flex-1 px-6">
          <View className="flex-col justify-center items-stretch gap-4 pb-10">
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
              <Text className="font-montserrat-bold text-2xl pb-4">My Offers</Text>
              <View className="flex flex-col gap-4 w-full">
                {user.offers.map((offer) => (
                  <Offer key={offer.id} offer={offer} />
                ))}
              </View>
            </View>

            <View className="bg-white rounded-lg p-4 border border-1 border-gray flex flex-col items-center">
              <Text className="font-montserrat-bold text-2xl pb-4">Offers to my products</Text>
              <View className="flex flex-col gap-4 w-full">
                {productOffers.map((offer) => (
                  <Offer key={offer.id} offer={offer} onAccept={handleAcceptOffer} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenWrapper>
    </>
  );
}

export default MyProfileScreen;
