import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';

const ForYou = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (photos.length >= 40) {
      Alert.alert('Maximum limit reached', 'You can only take up to 40 pictures');
      return;
    }

    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotos([...photos, photo]);
    }
  };

  const flipCamera = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        <Camera
          className="flex-1"
          type={type}
          ref={cameraRef}
        >
          <View className="flex-1 bg-transparent">
            {/* Camera Controls */}
            <View className="absolute bottom-0 w-full flex-row justify-between items-center p-4">
              <TouchableOpacity 
                className="bg-white/30 p-4 rounded-full"
                onPress={flipCamera}
              >
                <Text>Flip</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-white p-6 rounded-full"
                onPress={takePicture}
              >
                <View className="w-4 h-4 bg-black rounded-full" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-white/30 p-4 rounded-full"
                onPress={() => navigation.goBack()}
              >
                <Text>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Photo Counter */}
            <View className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white">{photos.length}/40</Text>
            </View>
          </View>
        </Camera>

        {/* Thumbnail Preview */}
        {photos.length > 0 && (
          <ScrollView 
            horizontal 
            className="absolute bottom-24 h-20"
            showsHorizontalScrollIndicator={false}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                className="w-16 h-16 mx-1 rounded"
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ForYou;
