import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Modal, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { acceptOffer } from '../../store/models/offers';
import { getUser } from '../../store/models/users';
import ScreenWrapper from '../../newComponents/layout/ScreenWrapper';
import Offer from './Offer';

function MyProfileScreen({}) {
  const user = useSelector((state) => state.users.data);
  const dispatch = useDispatch();
  const productOffers = useMemo(() => user.products.map((product) => product.offers).flat(), [user.products]);
  const [contactInfo, setContactInfo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    dispatch(getUser());
  }, []);

  useEffect(() => {
    console.log(productOffers);
  }, [productOffers]);

  const handleAcceptOffer = useCallback(async (offer) => {
    const res = await dispatch(acceptOffer(offer.id)).unwrap();
    await dispatch(getUser()).unwrap();
    if (res.user) {
      setContactInfo(res.user);
      setModalVisible(true);
    }
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
                  <Offer
                    key={offer.id}
                    offer={offer}
                    onAcceptOffer={() => handleAcceptOffer(offer)}
                    showAccept={true}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenWrapper>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black-600 bg-opacity-50">
          <View className="bg-white rounded-lg p-6 w-4/5">
            <Text className="font-montserrat-bold text-xl mb-4">Contact Information</Text>
            {contactInfo && (
              <View className="mb-4">
                <Text className="text-lg">Name: {contactInfo.name}</Text>
                <Text className="text-lg">Email: {contactInfo.email}</Text>
                <Text className="text-lg">Phone: {contactInfo.phone}</Text>
              </View>
            )}
            <TouchableOpacity
              className="bg-blue-500 py-2 px-4 rounded"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default MyProfileScreen;
