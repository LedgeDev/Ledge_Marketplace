import React, { useCallback, useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  LayoutAnimation,
} from 'react-native';
import { useSelector } from 'react-redux';
import ExtImage from '../../components/ExtImage';
import levelColors from '../../utils/level-colors';
import { useTranslation } from '../../hooks/useTranslation';
import ListLabels from '../../components/brandList/ListLabels';
import NewDotIndicator from '../../components/NewDotIndicator';

function Benefit({ onPress, benefit, className = '', isNew }) {
  const { locale } = useTranslation();
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={'#F1F1F1'}
      className="rounded-2xl"
    >
      <View className={`relative flex flex-row items-center justify-between bg-white p-4 rounded-2xl ${className}`}>
        <View className="flex flex-row items-center gap-4">
          <ExtImage
            mediaSource={benefit.logo}
            className="rounded-full w-14 h-14 bg-gray"
            quality="thumbnail"
          />
          <View>
            <Text>{benefit.title}</Text>
            <View className="flex-row items-center gap-2">
              <Text className="font-montserrat-alt-bold">{benefit.subtitle[locale]}</Text>
              <NewDotIndicator className="mt-0.5" show={isNew} />
            </View>
          </View>
        </View>
        <View className="absolute top-4 right-4 px-2 py-1 rounded-full" style={{ backgroundColor: levelColors(benefit.level?.order).textBg}}>
          <Text className="text-xs" style={{ color: levelColors(benefit.level?.order).text}}>{benefit.level?.name}</Text>
        </View>
      </View>
    </TouchableHighlight>
  );
}

function MyBenefits({ benefits, nextBenefits, setCurrentBenefit }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredBenefits, setFilteredBenefits] = useState([]);
  const [filteredNextBenefits, setFilteredNextBenefits] = useState([]);
  const { t, locale } = useTranslation();
  const benefitsSeenIds = useSelector((state) => state.benefits.levelBenefitsSeenIds);

  const filters = useMemo(() => {
    const allBenefits = benefits.concat(nextBenefits);
    const benefitLabels = Array.from(new Set(allBenefits.map((benefit) => benefit.tags.map(tag => tag[locale])).flat()));
    const benefitLabelsObjects = benefitLabels.map((label) => ({ name: label }));
    return benefitLabelsObjects;
  }, [benefits, nextBenefits, locale]);

  useLayoutEffect(() => {
    // initiate layout animation
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    // filter benefits and nextBenefits based on active filters
    if (!activeFilter) {
      setFilteredBenefits(benefits);
      setFilteredNextBenefits(nextBenefits);
      return;
    }
    const newFilteredBenefits = benefits.filter((benefit) => benefit.tags.some(tag => tag[locale] === activeFilter));
    const newFilteredNextBenefits = nextBenefits.filter((benefit) => benefit.tags.some(tag => tag[locale] === activeFilter));
    setFilteredBenefits(newFilteredBenefits);
    setFilteredNextBenefits(newFilteredNextBenefits);
  }, [activeFilter, benefits, nextBenefits]);

  const openBenefit = useCallback((benefit) => {
    setCurrentBenefit(benefit);
  }, [setCurrentBenefit]);

  return (
    <View>
      <View className="mb-5">
        <Text className="text-2xl font-montserrat-alt-bold mb-3">
        { t('settings.myDataView.benefitsList.collect')}
        </Text>
        <Text className="text-md mb-3">
        { t('settings.myDataView.benefitsList.description')}
        </Text>
      </View>
      <View className="w-full mb-5">
        <ListLabels
          justify="start"
          labels={filters}
          type="filter"
          filterBy={setActiveFilter}
        />
      </View>
      <View className="mb-5">
        <Text className="text-xl font-montserrat-alt-bold mb-3">
        { t('settings.myDataView.benefitsList.ready')}
        </Text>
        <View className="flex flex-col gap-2">
          {filteredBenefits.length > 0 && filteredBenefits.map((benefit) => (
            <Benefit
              onPress={() => openBenefit(benefit)}
              benefit={benefit}
              key={`benefit-${benefit.id}`}
              isNew={!benefitsSeenIds.includes(benefit.id)}
            />
          ))}
        </View>
      </View>
      <View className="mb-5">
        <Text className="text-xl font-montserrat-alt-bold mb-3">
        { t('settings.myDataView.benefitsList.soon')}
        </Text>
        <View className="flex flex-col gap-2">
          {filteredNextBenefits.length > 0 && filteredNextBenefits.map((benefit) => (
            <Benefit
              benefit={benefit}
              className="opacity-50"
              key={`benefit-${benefit.id}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default MyBenefits;
