import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Image, Alert, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { patchUser } from '../../store/models/users';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { getAccessTokenSilently } from '@auth0/auth0-react';

const BuyCredits = ({ onBack }) => {
  const user = useSelector(state => state.users.data);
  const dispatch = useDispatch();
  const credits = user?.aiCredits || 0;
  const [receipt, setReceipt] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePayPalRedirect = () => {
    Linking.openURL('https://paypal.me/aiCredits');
  };

  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need permission to access your photos to upload the receipt.');
        return;
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setReceipt(result.assets[0]);
    }
  };

  const processImage = async (imageUri) => {
    try {
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.3, format: SaveFormat.JPEG, base64: true }
      );
      
      return {
        uri: manipResult.uri,
        base64: manipResult.base64
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  };

  const uploadReceipt = async () => {
    if (!receipt) {
      Alert.alert('No receipt', 'Please select a receipt image first.');
      return;
    }

    setUploading(true);
    try {
      // Process the image using the same method as in ForYou
      const processedImage = await processImage(receipt.uri);
      
      if (!processedImage) {
        throw new Error('Failed to process image');
      }
      
      // Convert image to base64 URL format
      const formattedBase64 = `data:image/jpeg;base64,${processedImage.base64}`;
      
      // Use the Redux action to create a money transfer
      await dispatch(patchUser({ 
        moneyTransfers: {
          create: [{
            image: formattedBase64
          }]
        }
      }));
      
      Alert.alert(
        'Receipt Uploaded Successfully', 
        'Your transaction will be supervised, and the new credits will be available on your account within the next 24 hours. While you wait, you can still browse products or upload products manually.',
        [{ text: 'OK', onPress: () => setReceipt(null) }]
      );
    } catch (error) {
      console.error('Error uploading receipt:', error);
      
      let errorMessage = 'Failed to upload receipt. Please try again.';
      if (error.response) {
        errorMessage = `Server error: ${error.response.status}. ${error.response.data?.message || ''}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-white" style={{ marginTop: 100 }}>
      <View className="flex-row justify-between items-center mb-8 mt-4">
        <TouchableOpacity 
          className="bg-gray-200 p-2 rounded-full w-10 h-10 items-center justify-center"
          onPress={onBack}
        >
          <Text className="font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold flex-1 text-center">Buy Credits</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View className="items-center mb-6">
        <Text className="text-lg">Current balance: {credits} credits</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="items-center px-4">
          <Text className="text-lg text-center mb-8">
            Purchase credits to analyze and upload your products automatically.
          </Text>
          
          <View className="bg-gray-100 p-4 rounded-lg w-full mb-8">
            <Text className="text-lg font-bold mb-2">Credit Conversion Rate:</Text>
            <Text className="text-base mb-4">
              Each Euro (€1) = 100 AI Credits
            </Text>
            <Text className="text-base mb-2">
              How to purchase:
            </Text>
            <Text className="text-base mb-1">
              1. Click the PayPal button below
            </Text>
            <Text className="text-base mb-1">
              2. Make your payment
            </Text>
            <Text className="text-base mb-1">
              3. Upload the payment receipt
            </Text>
            <Text className="text-base mb-1">
              4. Credits will be added to your account after verification
            </Text>
          </View>
          
          <TouchableOpacity 
            className="bg-[#0070ba] py-4 px-8 rounded-lg w-full mb-8"
            onPress={handlePayPalRedirect}
          >
            <Text className="text-white text-center font-bold text-lg">Pay with PayPal</Text>
          </TouchableOpacity>
          
          <View className="w-full mb-8">
            <Text className="text-lg font-bold mb-4">Upload Payment Receipt</Text>
            <Text className="text-base mb-4">
              After making your payment, please upload a screenshot of your PayPal receipt.
            </Text>
            
            <TouchableOpacity 
              className="bg-blue-500 py-3 px-6 rounded-lg mb-4"
              onPress={pickImage}
            >
              <Text className="text-center font-semibold text-white">Select Receipt Image</Text>
            </TouchableOpacity>
            
            {receipt && (
              <View className="items-center mb-4">
                <Image 
                  source={{ uri: receipt.uri }} 
                  style={{ width: 200, height: 200, marginVertical: 10 }} 
                  className="rounded-lg"
                />
                <TouchableOpacity 
                  className="bg-green-600 py-3 px-6 rounded-lg"
                  onPress={uploadReceipt}
                  disabled={uploading}
                >
                  <Text className="text-white text-center font-semibold">
                    {uploading ? 'Uploading...' : 'Upload Receipt'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default BuyCredits;
