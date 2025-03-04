import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import Badge from '../Badge';

const ListLabels = ({ type, sortBy = () => {}, filterBy = () => {}, labels, justify = "center" }) => {
  const { t } = useTranslation();
  const [selectedSort, setSelectedSort] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const handleSortPress = (label) => {
    if (selectedSort !== label) {
      setSelectedSort(label);
      sortBy(label);
    } else {
      setSelectedSort(null);
      sortBy(null);
    }
  };

  const handleLabelPress = (label) => {
    if (selectedLabel !== label) {
      setSelectedLabel(label);
      filterBy(label);
    } else {
      setSelectedLabel(null);
      filterBy(null);
    }
  };

  if (type === 'sort') {
    return (
      <View className="flex-row mx-auto gap-1">
        <Text className="my-auto typography-footnote-regular text-[rgba(38,44,48,0.60)]">
          {`${t('brandList.sortBy')}: `}
        </Text>
        <Badge
          title={t('brandList.sortLatest')}
          onPress={() => handleSortPress('latest')}
          selected={selectedSort === 'latest'}
        />
        <Badge
          title={t('brandList.sortTimeLeft')}
          onPress={() => handleSortPress('timeLeft')}
          selected={selectedSort === 'timeLeft'}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="w-full overflow-visible"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, gap: 4 }}
      nestedScrollEnabled
    >
        {labels.map((label, index) => (
          <Badge
            key={index}
            title={label.name}
            onPress={() => handleLabelPress(label.name)}
            selected={selectedLabel === label.name}
          />
        ))}
    </ScrollView>
  );
};

export default ListLabels;
