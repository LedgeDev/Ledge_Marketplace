import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImages, uploadSingleImage, createProducts } from '../../store/models/products';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import BuyCredits from './BuyCredits';

const ForYou = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [images, setImages] = useState([]);
  const [analyzedResults, setAnalyzedResults] = useState([]);
  const { status } = useSelector(state => state.products);
  const user = useSelector(state => state.users.data);
  const credits = user?.aiCredits || 0;
  const isLoading = status === 'loading';
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [editMode, setEditMode] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  
  // Add keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const navigateToBuyCredits = () => {
    setShowBuyCredits(true);
  };

  const handleBackFromCredits = () => {
    setShowBuyCredits(false);
  };

  const pickImages = async () => {
    // Check if user has credits before allowing to pick images
    if (credits <= 0 && images.length === 0) {
      Alert.alert(
        "No Credits",
        "You don't have any credits left to analyze images. Would you like to buy more?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: navigateToBuyCredits }
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 15,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Check if we're adding to existing images or starting fresh
      if (images.length > 0) {
        // Add new images to existing ones
        setImages(prevImages => [...prevImages, ...result.assets]);
      } else {
        // First time selecting images
        setImages(result.assets);
      }
      setAnalyzedResults([]);
      setEditMode(false);
    }
  };

  // New function to open camera
  const openCamera = async () => {
    // Check if user has credits before allowing to use camera
    if (credits <= 0 && images.length === 0) {
      Alert.alert(
        "No Credits",
        "You don't have any credits left to analyze images. Would you like to buy more?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: navigateToBuyCredits }
        ]
      );
      return;
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "We need camera permissions to take pictures.",
        [{ text: "OK" }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Add the new image to existing images
      setImages(prevImages => [...prevImages, ...result.assets]);
      
      // Only reset analyzed results if we're not in the middle of editing
      if (!editMode) {
        setAnalyzedResults([]);
      }
    }
  };

  const processImage = async (imageUri) => {
    try {
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 400 } }],
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

  const handleUpload = async () => {
    if (images.length === 0) return;
    
    // Check if user has enough credits
    if (credits < images.length) {
      Alert.alert(
        "Not Enough Credits",
        `You need ${images.length} credits to analyze these images, but you only have ${credits}. Would you like to buy more?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: navigateToBuyCredits }
        ]
      );
      return;
    }
    
    setProgress({ current: 0, total: images.length });
    setAnalyzedResults([]);
    
    const results = [];
    const processedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const processedImage = await processImage(images[i].uri);
      
      if (processedImage) {
        processedImages.push(processedImage);
        
        try {
          const result = await dispatch(uploadSingleImage(processedImage)).unwrap();
          results.push(result);
        } catch (error) {
          console.error('Error uploading image:', error);
          results.push({ 
            isValid: false,
            tags: ['Error processing image'], 
            price: 'Unknown',
            productName: 'Error',
            description: 'There was an error processing this image.'
          });
        }
      } else {
        results.push({ 
          isValid: false,
          tags: ['Failed to process image'], 
          price: 'Unknown',
          productName: 'Error',
          description: 'Failed to process this image.'
        });
        processedImages.push(null);
      }
      
      setProgress({ current: i + 1, total: images.length });
      setAnalyzedResults([...results]);
    }
    
    // Update images with processed versions that include base64
    setImages(images.map((img, index) => ({
      ...img,
      base64: processedImages[index]?.base64
    })));
    
    // Enable edit mode after analysis is complete
    setEditMode(true);
  };

  const handleProductNameChange = (text, index) => {
    const updatedResults = [...analyzedResults];
    updatedResults[index] = { ...updatedResults[index], productName: text };
    setAnalyzedResults(updatedResults);
  };

  const handleDescriptionChange = (text, index) => {
    const updatedResults = [...analyzedResults];
    updatedResults[index] = { ...updatedResults[index], description: text };
    setAnalyzedResults(updatedResults);
  };

  const handlePriceChange = (text, index) => {
    const updatedResults = [...analyzedResults];
    updatedResults[index] = { ...updatedResults[index], price: text };
    setAnalyzedResults(updatedResults);
  };

  const handleUploadProducts = async () => {
    // Filter out invalid items before uploading
    const validProducts = analyzedResults.filter(result => result.isValid !== false);
    
    if (validProducts.length === 0) {
      Alert.alert(
        "No Valid Products", 
        "There are no valid products to upload. Please replace or delete invalid items.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      // Prepare the products data with images
      const productsToUpload = validProducts.map((result, index) => ({
        productName: result.productName,
        description: result.description,
        price: result.price,
        imageUri: images[index].uri,
        base64: images[index].base64 || null
      }));
      
      // Call the API to create the products
      await dispatch(createProducts(productsToUpload)).unwrap();
      
      // Show success message
      Alert.alert(
        "Success", 
        `${validProducts.length} product${validProducts.length > 1 ? 's' : ''} uploaded successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Reset the state after upload
              setImages([]);
              setAnalyzedResults([]);
              setEditMode(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error uploading products:', error);
      Alert.alert(
        "Upload Failed", 
        "There was an error uploading your products. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Add new function to handle image deletion
  const handleDeleteImage = (index) => {
    const newImages = [...images];
    const newResults = [...analyzedResults];
    
    newImages.splice(index, 1);
    newResults.splice(index, 1);
    
    setImages(newImages);
    setAnalyzedResults(newResults);
    
    // If all images are deleted, reset the state
    if (newImages.length === 0) {
      setEditMode(false);
    }
  };

  // Modify the function to handle image replacement
  const handleReplaceImage = async (index) => {
    Alert.alert(
      "Replace Image",
      "Choose how you want to replace this image",
      [
        {
          text: "Camera",
          onPress: async () => {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
              Alert.alert(
                "Permission Denied",
                "We need camera permissions to take pictures.",
                [{ text: "OK" }]
              );
              return;
            }
            
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: false,
              quality: 0.8,
              base64: false,
            });
            
            if (!result.canceled && result.assets.length > 0) {
              replaceAndAnalyzeImage(index, result.assets[0]);
            }
          }
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: false,
              quality: 0.8,
              base64: false,
            });
            
            if (!result.canceled && result.assets.length > 0) {
              replaceAndAnalyzeImage(index, result.assets[0]);
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  
  // Helper function to replace and analyze an image
  const replaceAndAnalyzeImage = async (index, newImage) => {
    // Replace the image at the specified index
    const newImages = [...images];
    newImages[index] = newImage;
    setImages(newImages);
    
    // Process and analyze the new image
    const processedImage = await processImage(newImage.uri);
    
    if (processedImage) {
      try {
        const result = await dispatch(uploadSingleImage(processedImage)).unwrap();
        
        // Update the analyzed results
        const newResults = [...analyzedResults];
        newResults[index] = result;
        setAnalyzedResults(newResults);
      } catch (error) {
        console.error('Error uploading replacement image:', error);
        // Handle error for the replaced image
        const newResults = [...analyzedResults];
        newResults[index] = { 
          isValid: false,
          tags: ['Error processing image'], 
          price: 'Unknown',
          productName: 'Error',
          description: 'There was an error processing this image.'
        };
        setAnalyzedResults(newResults);
      }
    }
  };

  // Add a new function to handle the "Add More" action
  const handleAddMore = () => {
    Alert.alert(
      "Add More Images",
      "Choose how you want to add more images",
      [
        {
          text: "Camera",
          onPress: openCamera
        },
        {
          text: "Gallery",
          onPress: pickImages
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const renderImageItem = ({ item, index }) => (
    <View className="mb-6 border border-gray-200 rounded-lg p-3">
      <View className="relative">
        <Image 
          source={{ uri: item.uri }} 
          className="w-full h-auto rounded-2xl mb-2" 
          style={{ aspectRatio: 1 }}
          resizeMode="contain"
        />
        
        {/* Delete button (cross) in the top right corner */}
        <TouchableOpacity 
          className="absolute top-2 right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow-md"
          onPress={() => handleDeleteImage(index)}
        >
          <Text className="font-bold text-lg">X</Text>
        </TouchableOpacity>
      </View>
      
      {analyzedResults[index] && (
        <View className={`p-2 rounded-lg ${analyzedResults[index].isValid === false ? 'bg-red-50' : 'bg-gray-50'}`}>
          {analyzedResults[index].isValid === false ? (
            <>
              <Text className="font-bold mb-1 text-red-600">Invalid Item</Text>
              <Text className="text-red-600 mb-2">{analyzedResults[index].reason || "This item cannot be analyzed as it appears to be not sellable."}</Text>
              
              {/* Keep only the Replace button for invalid items */}
              <View className="flex-row justify-center mt-2">
                <TouchableOpacity 
                  className="bg-blue-500 py-2 px-6 rounded-lg"
                  onPress={() => handleReplaceImage(index)}
                >
                  <Text className="text-white font-semibold text-center">Replace</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {editMode ? (
                <TextInput
                  className="font-bold mb-1 border-b border-gray-300 p-1"
                  value={analyzedResults[index].productName || ""}
                  onChangeText={(text) => handleProductNameChange(text, index)}
                  placeholder="Product Name"
                />
              ) : (
                <Text className="font-bold mb-1">{analyzedResults[index].productName || "Analysis"}</Text>
              )}
              
              {analyzedResults[index].description && (
                editMode ? (
                  <TextInput
                    className="mb-2 border border-gray-300 p-1 rounded"
                    value={analyzedResults[index].description}
                    onChangeText={(text) => handleDescriptionChange(text, index)}
                    placeholder="Description"
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text className="mb-2">{analyzedResults[index].description}</Text>
                )
              )}
              
              {editMode ? (
                <View className="flex-row items-center">
                  <Text>Value: $</Text>
                  <TextInput
                    className="border-b border-gray-300 p-1 flex-1 mr-1"
                    value={analyzedResults[index].price.toString()}
                    onChangeText={(text) => handlePriceChange(text, index)}
                    keyboardType="numeric"
                  />
                  <Text>USD</Text>
                </View>
              ) : (
                <Text>Value: € {analyzedResults[index].price}</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );

  // If showing buy credits, render that component
  if (showBuyCredits) {
    return (
      <View className="flex-1">
        <BuyCredits onBack={handleBackFromCredits} />
      </View>
    );
  }

  // Otherwise render the normal ForYou component
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <View className="flex-1 p-4 bg-white">
        {/* Credit counter at the top right */}
        <TouchableOpacity 
          className="absolute top-60 right-20 z-10 bg-blue-100 px-3 py-1 rounded-full flex-row items-center"
          onPress={navigateToBuyCredits}
        >
          <Text className="font-bold text-blue-600">{credits} Credits</Text>
        </TouchableOpacity>

        {images.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            {credits <= 0 ? (
              <View className="items-center p-6 bg-gray-50 rounded-lg">
                <Text className="text-lg text-center mb-4">
                  You need credits to analyze images. Go to buy more credits to continue uploading products, or upload them manually.
                </Text>
                <TouchableOpacity 
                  className="bg-blue-500 py-3 px-6 rounded-full"
                  onPress={navigateToBuyCredits}
                >
                  <Text className="text-white font-bold text-lg">Go to Buy Credits</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row space-x-4">
                <TouchableOpacity 
                  className="bg-blue-500 py-3 px-6 rounded-full"
                  onPress={pickImages}
                  disabled={isLoading}
                >
                  <Text className="text-white font-bold text-lg">Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="bg-green-500 py-3 px-6 rounded-full"
                  onPress={openCamera}
                  disabled={isLoading}
                >
                  <Text className="text-white font-bold text-lg">Camera</Text>
                </TouchableOpacity>
              </View>
            )}
            {credits > 0 && <Text className="text-gray-500 mt-3">Select up to {Math.min(15, credits)} images</Text>}
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
            
            <View className="absolute bottom-4 left-0 right-0 items-center">
              {analyzedResults.length > 0 && !isLoading && !isKeyboardVisible ? (
                <TouchableOpacity 
                  className="bg-green-600 py-3 px-6 rounded-full"
                  onPress={handleUploadProducts}
                >
                  <Text className="text-white font-bold text-lg">Upload Products</Text>
                </TouchableOpacity>
              ) : !isLoading && !isKeyboardVisible ? (
                <View className="flex-row space-x-4">
                  <TouchableOpacity 
                    className="bg-blue-500 py-3 px-6 rounded-full"
                    onPress={handleUpload}
                    disabled={isLoading}
                  >
                    <Text className="text-white font-bold text-lg">Analyze Images</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-green-500 py-3 px-6 rounded-full"
                    onPress={handleAddMore}
                    disabled={isLoading}
                  >
                    <Text className="text-white font-bold text-lg">Add More</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              
              {isLoading && (
                <View className="items-center justify-center py-4 bg-white rounded-lg shadow-md px-6">
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text className="mt-2">
                    Analyzing images... {progress.current}/{progress.total}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForYou;
