import React, { useState, useRef, useCallback } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import FilterOption from './FilterOption';
import CaretRight from '../../assets/svg/caret-right-gray.svg';

const FilterOptionsMenu = ({
  filterOptions = {},
  selectedOptions = {}, // { menuKey: [option1, option2, ...] }
  setSelectedOptions = () => {},
}) => {
  const [width, setWidth] = useState(0);
  const [selectedMenuKey, setSelectedMenuKey] = useState(null);
  const flatListItems = Array.from({ length: 2 }, (_, index) => index);
  const flatListRef = useRef(null);
  const flatlistGap = 24;
  
  const handleFirstPageOptionPress = useCallback((menuKey) => {
    setSelectedMenuKey(menuKey);
    flatListRef.current.scrollToIndex({ index: 1, animated: true });
  }, [flatListRef]);

  const handleSecondPageOptionPress = useCallback((option) => {
    // remove options from the same submenu and add or remove the new option
    const newSelectedOptions = { ...selectedOptions };
    if (newSelectedOptions[selectedMenuKey]?.options.length > 0 && newSelectedOptions[selectedMenuKey]?.options[0] === option) {
      newSelectedOptions[selectedMenuKey].options = [];
    } else {
      newSelectedOptions[selectedMenuKey].options = [option];
    }
    setSelectedOptions(newSelectedOptions);
    flatListRef.current.scrollToIndex({ index: 0, animated: true });
    setTimeout(() => setSelectedMenuKey(null), 100);
  }, [selectedOptions, selectedMenuKey, setSelectedOptions, flatListRef]);

  const renderSecondPage = useCallback(() => {
    return (
      <View style={{ width: width }}>
        <ScrollView
          className="w-full max-h-96"
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <View onStartShouldSetResponder={() => true}>
            { filterOptions[selectedMenuKey]?.options.map((option, index) => (
              <View key={index} className="w-full">
                <FilterOption
                  name={option.name}
                  onPress={() => handleSecondPageOptionPress(option)}
                  selected={selectedOptions[selectedMenuKey]?.options.some(selectedOption => selectedOption.value === option.value)}
                />
              </View>
            )) }
          </View>
        </ScrollView>
      </View>
    )
  }, [selectedMenuKey, selectedOptions, width]);


  const renderItem = useCallback(({ item, index }) => {
    if (index === 0) {
      return (
        <View style={{ width: width }}>
          { Object.entries(filterOptions).map(([optionKey, option]) => (
            <View key={optionKey} className="w-full">
              <FilterOption
                name={option.name}
                onPress={() =>handleFirstPageOptionPress(optionKey)}
                Icon={CaretRight}
                indicator={selectedOptions[optionKey]?.options.length > 0 ? selectedOptions[optionKey]?.options[0].name : null}
                disableHapticFeedback={true}
              />
            </View>
          )) }
        </View>
      )
    } else {
      return renderSecondPage();
    }
  }, [renderSecondPage, selectedOptions, width]);

  return (
    <View className="w-full" onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <FlatList
        ref={flatListRef}
        className="w-full"
        ItemSeparatorComponent={() => <View style={{ width: flatlistGap }} />}
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        data={flatListItems}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        getItemLayout={(data, index) => ({
          length: width,
          offset: (width + flatlistGap) * index,
          index
        })}
        horizontal
      />
    </View>
  )
}


export default FilterOptionsMenu;