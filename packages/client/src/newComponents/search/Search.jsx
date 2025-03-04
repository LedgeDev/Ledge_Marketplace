import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAnalytics } from '../../hooks/useAnalytics';
import { searchBrands, clearSearchResults } from '../../store/models/brands';
import ScreenWrapper from '../layout/ScreenWrapper';
import SearchResults from './SearchResults';
import SearchIcon from '../../assets/svg/search.svg';
import CloseCircleIcon from '../../assets/svg/close-circle-gray.svg';

const Search = React.forwardRef(({ }, ref) => {
  const dispatch = useDispatch();
  const analytics = useAnalytics();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const barTranslateY = useSharedValue(0);
  const modalSearchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: barTranslateY.value }]
  }));

  const handleOpenModal = () => {
    barTranslateY.value = withTiming(-52, { duration: 200, });
    setTimeout(() => {
      setActive(true);
    }, 100);
  };

  const handleCloseModal = () => {
    setActive(false);
    barTranslateY.value = withTiming(0, { duration: 300, });
  };

  const handleTextInputChange = async(text) => {
    if (text.length === 0) {
      dispatch(clearSearchResults());
    }
    // do search after 3 seconds of inactivity. if there is a change again, reset the timer
    setLoading(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      await dispatch(searchBrands(text)).unwrap();
      analytics.capture('Search', {
        type: 'search',
        details: {
          searchTerm: text,
        },
      });
      setLoading(false);
    }, 1500);
  }

  useEffect(() => {
    if (active && modalSearchInputRef.current) {
      setTimeout(() => {
        modalSearchInputRef.current.focus();
      }, 200);
    }
  }, [active, modalSearchInputRef.current]);

  return (
    <>
      <View ref={ref} className="w-full px-6 pb-2 z-50">
        <Animated.View
          className="relative flex-row items-center p-2.5 bg-gray rounded-lg"
          style={barStyle}
        >
          <TextInput
            className="w-full pl-6 text-md"
            placeholder="Search..."
            placeholderTextColor={'black'}
            readOnly
            onPress={handleOpenModal}
          />
          <View className="absolute left-2">
            <SearchIcon width={16} height={16} />
          </View>
        </Animated.View>
      </View>
      <Modal
        animationType="fade"
        visible={active}
      >
        <ScreenWrapper>
          <View className="w-full flex-1 pb-2 pt-4 z-20">
            <View className="w-full px-6">
              <Animated.View
                className="relative flex-row items-center p-2.5 bg-white rounded-lg border border-gray z-20"
              >
                <TextInput
                  className="w-full pl-6 text-md"
                  placeholder="Search..."
                  placeholderTextColor={'black'}
                  ref={modalSearchInputRef}
                  onChangeText={handleTextInputChange}
                />
                <View className="absolute left-2">
                  <SearchIcon width={16} height={16} />
                </View>
                <TouchableOpacity
                  className="absolute right-2"
                  onPress={handleCloseModal}
                >
                  <CloseCircleIcon width={24} height={24} />
                </TouchableOpacity>
              </Animated.View>
            </View>
            <View className="z-10">
              <SearchResults onBrandPress={handleCloseModal} loading={loading} />
            </View>
          </View>
        </ScreenWrapper>
      </Modal>
    </>
  );
});

export default Search;
