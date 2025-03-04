import React, {useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity,} from 'react-native';
import {fetchBrandsByIds,getForYouBrands,removeDeleted,getDiscoveryBrands} from '../../../store/models/brands';
import { fetchCurrentUser } from '../../../store/models/users';
import Button from '../../../components/Button';
import { Alert } from 'react-native';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDispatch, useSelector } from 'react-redux';

function RestoreDeletedBrands({ bottomSheetModalRef }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.users.data);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.deletedBrands?.length) {
      dispatch(fetchBrandsByIds(user.deletedBrands))
        .unwrap()
        .then(fetchedBrands => {
          setBrands(fetchedBrands);
        })
        .catch(error => {
          console.error('Failed to fetch brands:', error);
        });
    }
  }, [dispatch, user?.deletedBrands]);

  const handleRestore = async (brandIds) => {
    if (!brandIds.length) {
      Alert.alert("No Brands", "There are no brands to restore.");
      return;
    }
    Alert.alert(
      "Confirm Restore",
      "This will return the brand(s) to your application.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            setIsLoading(true);
            try {
              // restore the brands
              await dispatch(removeDeleted(brandIds)).unwrap();
              // update the user
              const updatedUser = await dispatch(fetchCurrentUser()).unwrap();
              // if the user has no deleted brands, clear the list
              if (!updatedUser.deletedBrands.length) {
                setBrands([]);
              }
              // update the for you brands
              await dispatch(getForYouBrands()).unwrap();
              await dispatch(getDiscoveryBrands()).unwrap();
            } catch (error) {
              console.error("Error during restore:", error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <View className="flex-1 p-5 w-full mb-5">
      <Text className="text-xl font-bold mb-5 w-full">{t('settings.myDataDeletedBrands.header')}</Text>

      {isLoading ? (
        <ActivityIndicator className="pb-3" size="small" color="#999999" />
      ) : (
        brands.map((brand, index) => (
          <View key={index} className="flex-row justify-between items-center mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold">{brand.name}</Text>
              <Text className="text-sm text-gray-500">{brand.mainPhrase}</Text>
            </View>
            <Button
              onPress={() => {
                handleRestore([brand.id])}}
              color={'pink'}
            >
              <Text className="text-pink-dark font-medium">{ t('settings.restore') }</Text>
            </Button>
          </View>
        ))
      )}
    <Button
      onPress={() => {handleRestore(brands.map(brand => brand.id))}}
      disabled={brands.length === 0 || isLoading}
      color="pink"
      className={`${brands.length === 0 || isLoading ? 'opacity-50' : ''}`}
      big
    >
      <Text className="text-center text-pink-dark font-montserrat-alt-bold">
        {brands.length > 0 ? t('settings.restoreAll') : t('settings.noBrandsToRestore')}
      </Text>
    </Button>

    </View>
  );
}

export default RestoreDeletedBrands;
