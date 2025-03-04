import React from 'react';
import {
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MuteIcon from '../assets/svg/mute.svg';
import UnMuteIcon from '../assets/svg/unMute.svg';

const iconSize = 22;

function MuteButton({ isMuted, onMute }) {
  return (
    <TouchableOpacity
      className="absolute w-[40] h-[40] z-40 right-[20] bottom-[20] bg-blue-300 rounded-full overflow-hidden border border-1 border-blue-180"
      onPress={onMute}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      <BlurView
        className="w-full h-full rounded-full z-30 justify-center items-center"
        intensity={10}
        tint="light"
      >
        {isMuted ?  <MuteIcon width={iconSize} height={iconSize}/> :
        <UnMuteIcon width={iconSize} height={iconSize}/>}
      </BlurView>
    </TouchableOpacity>
  );
}

export default MuteButton;