import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import LockBlue from '../assets/svg/lock-blue.svg';
import CirclePinkDark from '../assets/svg/circle-pink-dark.svg';

function MenuList({ items }) {
  // each item must be an object with the following properties:
  //  {
  //   item: object,
  //   text: name to display,
  //   onPress: function,
  //   locked: boolean,
  //   new: boolean,
  // }
  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-8">
      {items.map((item, index) => (
        <View key={index}>
          <TouchableHighlight
            underlayColor={`${item.new ? '#993B57' : '#F1F1F1'}`}
            onPress={item.onPress}
            disabled={item.locked}
          >
            <View
              className={`flex flex-row justify-between items-center ${(item.new || item.locked) ? 'pl-4 pr-10' : 'px-4'} py-3 ${item.new ? 'bg-pink-light' : 'bg-transparent'} ${item.locked ? 'opacity-50' : ''}`}
            >
              <Text>{item.text}</Text>
              <View className="absolute right-4">
                {item.new && (
                  <CirclePinkDark className="w-10 h-10"></CirclePinkDark>
                )}
                {item.locked && <LockBlue className="w-10 h-10"></LockBlue>}
              </View>
            </View>
          </TouchableHighlight>
          {index < items.length - 1 && (
            <View className="bg-gray h-[1px] w-full"></View>
          )}
        </View>
      ))}
    </View>
  );
}

export default MenuList;
