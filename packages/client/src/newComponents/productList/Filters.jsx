import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import FilterLabel from './FilterLabel';
import FiltersModal from './FiltersModal';
import FilterOptionsMenu from './FilterOptionsMenu';
import { filterBrands } from '../../utils/brand-utils';
import FiltersIconGray from '../../assets/svg/filters-gray.svg';
import FiltersIconWhite from '../../assets/svg/filters-white.svg';
import MapPin from '../../assets/svg/map-pin.svg';

const getEmptyFilterOptions = (filterOptions) => {
  const emptyFilterOptions = {...filterOptions};
  Object.keys(emptyFilterOptions).forEach(key => {
    emptyFilterOptions[key] = { options: [] };
  });
  return emptyFilterOptions;
}

const Filters = ({ brands = [], setFilteredBrands = () => {} }) => {
  const { t, locale } = useTranslation();
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [filterOptionsModalVisible, setFilterOptionsModalVisible] = useState(false);
  const labels = useMemo(() => {
    const brandLabels = Array.from(new Set(brands.map((brand) => brand.labels.map(label => label[locale])).flat()));
    const brandLabelsObjects = brandLabels.map((label) => ({ name: label }));
    return brandLabelsObjects;
  }, [brands, locale]);
  const filterOptions = useMemo(() => {
    const distinctCategoryNames = Array.from(new Set(brands.map((brand) => brand.category?.name[locale]))).filter(category => category && category !== '');
    return {
      sortBy: {
        name: 'Sort by',
        options: [
          { name: 'Relevance', value: 'relevance' },
          { name: 'Most liked', value: 'likes' },
          { name: 'Best rated', value: 'rating' },
          { name: 'Latest', value: 'latest' }
        ]
      },
      gender: {
        name: 'Gender',
        options: [{
          name: 'Male',
          value: 'men'
        }, {
          name: 'Female',
          value: 'women'
        }, {
          name: 'Unisex',
          value: 'both'
        }]
      },
      category: {
        name: 'Category',
        options: distinctCategoryNames.map((category) => ({
          name: category,
          value: category
        }))
      }
    }
  }, []);
  const [selectedFilterOptions, setSelectedFilterOptions] = useState(getEmptyFilterOptions(filterOptions));
  const filterOptionSelected = useMemo(() => {
    if (!selectedFilterOptions) return false;
    return Object.values(selectedFilterOptions).some(option => {
      if (option.options.length > 0) {
        return true;
      }
    });
  }, [selectedFilterOptions]);

  useEffect(() => {
    const filteredBrands = filterBrands(brands, selectedFilterOptions, selectedLabels);
    setFilteredBrands(filteredBrands);
  }, [selectedFilterOptions, selectedLabels]);

  const handleLabelPress = useCallback((name) => {
    if (selectedLabels.includes(name)) {
      setSelectedLabels([]);
    } else {
      setSelectedLabels([name]);
    }
  }, [selectedLabels]);

  const handleFilterOptionsModalDone = useCallback(() => {
    // TODO: Implement filter options filtering
    setFilterOptionsModalVisible(false);
  }, []);

  const handleFilterOptionsModalClear = useCallback(() => {
    setSelectedFilterOptions(getEmptyFilterOptions(filterOptions));
  }, [filterOptions]);

  const ActionLabels = () => {
    return (
      <View className="flex-row mx-auto gap-1">
        <FilterLabel
          Icon={filterOptionSelected ? FiltersIconWhite : FiltersIconGray}
          onPress={() => setFilterOptionsModalVisible(true)}
          selected={filterOptionSelected}
        />
        <FilterLabel title={t('brandList.closeBy')} Icon={MapPin} />
      </View>
    )
  }

  return (
    <>
      <FlatList
        className="w-full overflow-visible"
        ListHeaderComponent={<ActionLabels />}
        data={labels}
        renderItem={({ item }) => (
          <FilterLabel
            title={item.name}
            selected={selectedLabels.includes(item.name)}
            onPress={handleLabelPress}
          />
        )}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, gap: 4 }}
        nestedScrollEnabled
      />
      <FiltersModal
        visible={filterOptionsModalVisible}
        title={t('brandList.filterOptions')}
        setModalVisible={setFilterOptionsModalVisible}
        onClear={handleFilterOptionsModalClear}
        onDone={handleFilterOptionsModalDone}
      >
        <FilterOptionsMenu
          filterOptions={filterOptions}
          selectedOptions={selectedFilterOptions}
          setSelectedOptions={setSelectedFilterOptions}
        />
      </FiltersModal>
      
    </>
  );
};

export default Filters;
