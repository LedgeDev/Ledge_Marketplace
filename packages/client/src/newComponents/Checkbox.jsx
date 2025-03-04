import React from 'react';
import { Pressable, Text, LayoutAnimation } from 'react-native';
import CheckWhiteSmall  from '../assets/svg/check-white-small.svg';

function Checkbox({ value, onChange, className }) {

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(!value);
  }

  return (
    <Pressable
      className={`
        w-[18] h-[18] rounded-[6] border border-black ${value ? 'bg-black' : 'bg-white'}
        justify-center items-center ${className}
      `}
      onPress={handlePress}
    >
      {value && <CheckWhiteSmall width={27} height={27} />}
    </Pressable>
  );
}

export default Checkbox;