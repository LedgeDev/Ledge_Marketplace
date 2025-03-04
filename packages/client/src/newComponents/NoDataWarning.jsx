import React from 'react';
import { View, Text, Image, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import Button from './Button';

const NoDataWarning = ({ component, onRefresh = () => {}, refreshing }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  if (component === 'MyFavourites' || component === 'MyDeals') {
    return (
      <ScrollView
        className="h-full w-full pb-24 px-16"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignContent: 'center',
          gap: 32,
        }}
        refreshControl={
          refreshing !== undefined ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : null
        }
      >
        <Text maxFontSizeMultiplier={1.5} className="text-center text-blue typography-title2-emphasized font-montserrat-alt-bold">
          {t('noDataWarning.myBrands.title')}
        </Text>
        <Image
          className="w-52 h-52 self-center"
          resizeMode="contain"
          source={require('../assets/images/walking-lady.png')}
        />
        <Text className="text-center text-blue font-inter">
          {t('noDataWarning.myBrands.subtitle')}
        </Text>
        <Button
          className="w-full"
          color="pink"
          onPress={() => navigation.navigate('Explore')}
          big
        >
          <Text maxFontSizeMultiplier={1.5} className="font-montserrat-alt-bold text-pink-dark">
            {t('noDataWarning.myBrands.button')}
          </Text>
        </Button>
      </ScrollView>
    );
  } else if (component === 'ForYou') {
    return (
      <ScrollView
        className="h-full w-full pb-24 px-16"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignContent: 'center',
          gap: 32,
        }}
        refreshControl={
          refreshing !== undefined ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : null
        }
      >
        <Text maxFontSizeMultiplier={1.5} className="text-center text-blue typography-title2-emphasized font-montserrat-alt-bold">
          {t('noDataWarning.forYou.title')}
        </Text>
        <Image
          className="w-40 h-40 h-auto self-center"
          resizeMode="contain"
          source={require('../assets/images/walk-umbrella.png')}
        />
        <Text className="text-center text-blue font-inter">
          {t('noDataWarning.forYou.subtitle')}
        </Text>
        <Button
          color="pink"
          onPress={() => navigation.navigate('Pool Refill', { showNoDataWarning: true })}
          big
        >
          <Text className="text-pink-dark font-montserrat-alt-bold">{t('noDataWarning.forYou.button')}</Text>
        </Button>
      </ScrollView>
    );
  } else if (component === 'browse') {
    return (
      <ScrollView
        className="h-full w-full pb-24 px-16"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignContent: 'center',
          gap: 32,
        }}
        refreshControl={
          refreshing !== undefined ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : null
        }
      >
        <Text maxFontSizeMultiplier={1.5} className="text-center text-blue typography-title2-emphasized font-montserrat-alt-bold">
          {t('noDataWarning.browse.title')}
        </Text>
        <Image
          className="w-60 h-auto self-center"
          resizeMode="contain"
          source={require('../assets/images/walk-outside.png')}
        />
        <Text className="text-center text-blue font-inter">
          {t('noDataWarning.browse.subtitle')}
        </Text>
      </ScrollView>
    );
  }
};

export default NoDataWarning;
