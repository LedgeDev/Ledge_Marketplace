import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

const ForYou = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View className="flex-1 flex-col justify-center items-center">
      { permission && permission.granted && (
        <CameraView style={{ flex: 1, width: '100%' }} facing={facing}>
          <View className="flex-1 justify-end items-center pb-10">
            <TouchableOpacity onPress={toggleCameraFacing}>
              <Text className="text-white text-2xl">Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
      { (!permission || !permission.granted) && (
        <View>
          <TouchableOpacity onPress={requestPermission}>
            <Text className="text-black">Request Permission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ForYou;
