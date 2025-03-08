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
  const [manualMode, setManualMode] = useState(false);
  const [manualProducts, setManualProducts] = useState([]);
  
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

  // Add function to toggle between AI analysis and manual mode
  const toggleManualMode = () => {
    setManualMode(!manualMode);
    // Reset analyzed results when switching modes
    if (!manualMode) {
      setAnalyzedResults([]);
    }
  };

  // Add function to add a blank manual product
  const addManualProduct = () => {
    setManualProducts([
      ...manualProducts,
      {
        productName: "",
        description: "",
        price: "",
        isManual: true
      }
    ]);
  };

  // Add function to update manual product details
  const updateManualProduct = (index, field, value) => {
    const updatedProducts = [...manualProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setManualProducts(updatedProducts);
  };

  // Add function to delete a manual product
  const deleteManualProduct = (index) => {
    const newProducts = [...manualProducts];
    newProducts.splice(index, 1);
    setManualProducts(newProducts);
  };

  // Modify handleUploadProducts to include manual products
  const handleUploadProducts = async () => {
    // For AI analyzed products
    const validProducts = analyzedResults.filter(result => result.isValid !== false);
    
    // Combine AI analyzed and manual products
    const allProducts = [
      // AI analyzed products with images
      ...validProducts.map((result, index) => ({
        productName: result.productName,
        description: result.description,
        price: result.price,
        imageUri: images[index].uri,
        base64: images[index].base64 || null,
        isManual: false
      })),
      // Manual products with images
      ...manualProducts.map((product, index) => ({
        productName: product.productName,
        description: product.description,
        price: product.price,
        imageUri: images[index]?.uri || null,
        base64: images[index]?.base64 || null,
        isManual: true
      }))
    ];
    
    if (allProducts.length === 0) {
      Alert.alert(
        "No Products", 
        "There are no products to upload. Please add at least one product.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      // Call the API to create the products
      await dispatch(createProducts(allProducts)).unwrap();
      
      // Show success message
      Alert.alert(
        "Success", 
        `${allProducts.length} product${allProducts.length > 1 ? 's' : ''} uploaded successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Reset the state after upload
              setImages([]);
              setAnalyzedResults([]);
              setManualProducts([]);
              setEditMode(false);
              setManualMode(false);
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

  // Add a render function for manual product items
  const renderManualProductItem = ({ item, index }) => (
    <View className="mb-6 border border-gray-200 rounded-lg p-3">
      <View className="relative">
        {item.imageUri ? (
          <Image 
            source={{ uri: item.imageUri }} 
            className="w-full h-auto rounded-2xl mb-2" 
            style={{ aspectRatio: 1 }}
            resizeMode="contain"
          />
        ) : (
          <TouchableOpacity 
            className="w-full h-40 rounded-2xl mb-2 bg-gray-100 items-center justify-center border border-dashed border-gray-300"
            onPress={() => handleAddImageToManualProduct(index)}
          >
            <Text className="text-gray-500">Tap to add an image (optional)</Text>
          </TouchableOpacity>
        )}
        
        {/* Delete button */}
        <TouchableOpacity 
          className="absolute top-2 right-2 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow-md"
          onPress={() => deleteManualProduct(index)}
        >
          <Text className="font-bold text-lg text-white">X</Text>
        </TouchableOpacity>
      </View>
      
      <View className="p-2 rounded-lg bg-gray-50">
        <TextInput
          className="font-bold mb-1 border-b border-gray-300 p-1"
          value={item.productName}
          onChangeText={(text) => updateManualProduct(index, 'productName', text)}
          placeholder="Product Name"
        />
        
        <TextInput
          className="mb-2 border border-gray-300 p-1 rounded"
          value={item.description}
          onChangeText={(text) => updateManualProduct(index, 'description', text)}
          placeholder="Description"
          multiline
          numberOfLines={3}
        />
        
        <View className="flex-row items-center">
          <Text>Value: $</Text>
          <TextInput
            className="border-b border-gray-300 p-1 flex-1 mr-1"
            value={item.price.toString()}
            onChangeText={(text) => updateManualProduct(index, 'price', text)}
            keyboardType="numeric"
            placeholder="0.00"
          />
          <Text>USD</Text>
        </View>
      </View>
    </View>
  );

  // Add function to add an image to a manual product
  const handleAddImageToManualProduct = (index) => {
    Alert.alert(
      "Add Image",
      "Choose how you want to add an image",
      [
        {
          text: "Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
              Alert.alert("Permission Denied", "We need camera permissions to take pictures.");
              return;
            }
            
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets.length > 0) {
              const updatedProducts = [...manualProducts];
              updatedProducts[index] = {
                ...updatedProducts[index],
                imageUri: result.assets[0].uri
              };
              setManualProducts(updatedProducts);
            }
          }
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets.length > 0) {
              const updatedProducts = [...manualProducts];
              updatedProducts[index] = {
                ...updatedProducts[index],
                imageUri: result.assets[0].uri
              };
              setManualProducts(updatedProducts);
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

        {/* Mode toggle button */}
        {(images.length > 0 || manualProducts.length > 0) && (
          <TouchableOpacity 
            className={`absolute top-60 left-4 z-10 px-3 py-1 rounded-full flex-row items-center ${manualMode ? 'bg-green-100' : 'bg-blue-100'}`}
            onPress={toggleManualMode}
          >
            <Text className={`font-bold ${manualMode ? 'text-green-600' : 'text-blue-600'}`}>
              {manualMode ? 'Manual Mode' : 'AI Analysis Mode'}
            </Text>
          </TouchableOpacity>
        )}

        {images.length === 0 && manualProducts.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <View className="items-center p-6 bg-gray-50 rounded-lg mb-4">
              <Text className="text-lg text-center mb-4">
                Choose how you want to upload your products:
              </Text>
              <View className="flex-row space-x-4 mb-4">
                <TouchableOpacity 
                  className="bg-blue-500 py-3 px-6 rounded-full"
                  onPress={() => {
                    if (credits <= 0) {
                      Alert.alert(
                        "No Credits",
                        "You don't have any credits for AI analysis. Would you like to buy more or use manual upload?",
                        [
                          { text: "Buy Credits", onPress: navigateToBuyCredits },
                          { text: "Manual Upload", onPress: () => {
                            setManualMode(true);
                            addManualProduct();
                          }},
                          { text: "Cancel", style: "cancel" }
                        ]
                      );
                    } else {
                      Alert.alert(
                        "AI Analysis",
                        "Use AI to automatically analyze your product images (uses credits)",
                        [
                          { text: "Continue", onPress: () => {
                            setManualMode(false);
                            pickImages();
                          }},
                          { text: "Cancel", style: "cancel" }
                        ]
                      );
                    }
                  }}
                >
                  <Text className="text-white font-bold text-lg">AI Analysis</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="bg-green-500 py-3 px-6 rounded-full"
                  onPress={() => {
                    setManualMode(true);
                    addManualProduct();
                  }}
                >
                  <Text className="text-white font-bold text-lg">Manual Upload</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-500 text-center">
                AI Analysis: Automatically detects product details (uses credits)
              </Text>
              <Text className="text-gray-500 text-center">
                Manual Upload: Enter product details yourself (free)
              </Text>
            </View>
            
            {credits <= 0 && (
              <TouchableOpacity 
                className="bg-blue-500 py-2 px-4 rounded-lg mt-2"
                onPress={navigateToBuyCredits}
              >
                <Text className="text-white font-semibold">Buy AI Credits</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : manualMode ? (
          <View className="flex-1">
            <FlatList
              data={manualProducts}
              renderItem={renderManualProductItem}
              keyExtractor={(item, index) => `manual-${index}`}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
            
            <View className="absolute bottom-4 left-0 right-0 items-center">
              {!isKeyboardVisible && (
                <View className="flex-row space-x-4">
                  <TouchableOpacity 
                    className="bg-green-500 py-3 px-6 rounded-full"
                    onPress={addManualProduct}
                  >
                    <Text className="text-white font-bold text-lg">Add Product</Text>
                  </TouchableOpacity>
                  
                  {manualProducts.length > 0 && (
                    <TouchableOpacity 
                      className="bg-blue-600 py-3 px-6 rounded-full"
                      onPress={handleUploadProducts}
                    >
                      <Text className="text-white font-bold text-lg">Upload Products</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          // Original AI analysis mode UI
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
