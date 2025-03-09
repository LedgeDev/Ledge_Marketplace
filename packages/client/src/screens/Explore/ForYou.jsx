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
import { uploadSingleImage, createProducts} from '../../store/models/products';
import { updateUserCredits } from '../../store/models/users';
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
  const credits = user?.aiCredits || 20;
  const isLoading = status === 'loading';
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [editMode, setEditMode] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualProducts, setManualProducts] = useState([]);
  const [isManualProduct, setIsManualProduct] = useState(false);
  
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
    // Skip credit check for manual uploads
    if (!isManualProduct && credits <= 0 && images.length === 0) {
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
      
      // If this is a manual product, create placeholder results
      if (isManualProduct) {
        const placeholders = result.assets.map(() => ({
          isManual: true,
          productName: "",
          description: "",
          price: "",
          isValid: true
        }));
        
        setAnalyzedResults(prevResults => [...prevResults, ...placeholders]);
        setEditMode(true);
      } else {
        // Only reset analyzed results if we're not in edit mode
        if (!editMode) {
          setAnalyzedResults([]);
        }
      }
    }
  };

  const openCamera = async () => {
    // Skip credit check for manual uploads
    if (!isManualProduct && credits <= 0 && images.length === 0) {
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
      
      // If this is a manual product, create a placeholder result
      if (isManualProduct) {
        setAnalyzedResults(prevResults => [
          ...prevResults, 
          {
            isManual: true,
            productName: "",
            description: "",
            price: "",
            isValid: true
          }
        ]);
        setEditMode(true);
      } else if (!editMode) {
        // Only reset analyzed results if we're not in the middle of editing
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
    
    // Skip AI analysis for manual products
    if (isManualProduct) {
      setEditMode(true);
      return;
    }
    
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
    
    // Deduct credits before starting the analysis
    try {
      // Update the user's credits in the Redux store and on the server
      await dispatch(updateUserCredits(credits - images.length)).unwrap();
    } catch (error) {
      console.error('Error updating user credits:', error);
      Alert.alert(
        "Error",
        "There was an error updating your credits. Please try again.",
        [{ text: "OK" }]
      );
      return;
    }
    
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
    // Prepare products for upload
    const productsToUpload = analyzedResults.map((result, index) => ({
      productName: result.productName,
      description: result.description,
      price: result.price,
      imageUri: images[index]?.uri || null,
      base64: images[index]?.base64 || null,
      isManual: result.isManual || false
    })).filter(product => 
      // Filter out products without names
      product.productName && product.productName.trim() !== ""
    );
    
    if (productsToUpload.length === 0) {
      Alert.alert(
        "No Valid Products", 
        "Please provide at least a product name for each item you want to upload.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      // Check if all products are manual
      const allManual = productsToUpload.every(product => product.isManual);
      
      // Set loading state with appropriate message
      setProgress({ 
        current: 0, 
        total: productsToUpload.length,
        isUploading: true // Add flag to indicate we're uploading, not analyzing
      });
      
      // Call the API to create the products
      await dispatch(createProducts(productsToUpload)).unwrap();
      
      // Show success message
      Alert.alert(
        "Success", 
        `${productsToUpload.length} product${productsToUpload.length > 1 ? 's' : ''} uploaded successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Reset the state after upload
              setImages([]);
              setAnalyzedResults([]);
              setEditMode(false);
              setIsManualProduct(false);
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
      {/* Only show image or placeholder if this isn't a manual product with no image */}
      {(item || !analyzedResults[index]?.isManual) ? (
        item ? (
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
              <Text className="font-bold text-lg text-white">X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            className="w-full h-40 rounded-2xl mb-2 bg-gray-100 items-center justify-center border border-dashed border-gray-300"
            onPress={() => handleAddImageToProduct(index)}
          >
            <Text className="text-gray-500">Tap to add an image (optional)</Text>
          </TouchableOpacity>
        )
      ) : null}
      
      {/* Always show the form fields for manual products */}
      {(analyzedResults[index] || isManualProduct) && (
        <View className={`p-2 rounded-lg ${analyzedResults[index]?.isValid === false ? 'bg-red-50' : 'bg-gray-50'}`}>
          {analyzedResults[index]?.isValid === false ? (
            <>
              <Text className="font-bold mb-1 text-red-600">Invalid Item</Text>
              <Text className="text-red-600 mb-2">{analyzedResults[index]?.reason || "This item cannot be analyzed as it appears to be not sellable."}</Text>
              
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
              {/* Always show editable fields for manual products */}
              <TextInput
                className="font-bold mb-1 border-b border-gray-300 p-1"
                value={analyzedResults[index]?.productName || ""}
                onChangeText={(text) => handleProductNameChange(text, index)}
                placeholder="Product Name"
              />
              
              <TextInput
                className="mb-2 border border-gray-300 p-1 rounded"
                value={analyzedResults[index]?.description || ""}
                onChangeText={(text) => handleDescriptionChange(text, index)}
                placeholder="Description"
                multiline
                numberOfLines={3}
              />
              
              <View className="flex-row items-center">
                <Text>Value: $</Text>
                <TextInput
                  className="border-b border-gray-300 p-1 flex-1 mr-1"
                  value={analyzedResults[index]?.price?.toString() || ""}
                  onChangeText={(text) => handlePriceChange(text, index)}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text>USD</Text>
              </View>
              
              {/* Add image button for manual products without images */}
              {!item && analyzedResults[index]?.isManual && (
                <TouchableOpacity 
                  className="bg-gray-200 py-2 px-4 rounded-lg mt-3 self-center"
                  onPress={() => handleAddImageToProduct(index)}
                >
                  <Text className="text-gray-700">Add Image (Optional)</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );

  // Add function to add an image to a product
  const handleAddImageToProduct = (index) => {
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
              const newImages = [...images];
              newImages[index] = result.assets[0];
              setImages(newImages);
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
              const newImages = [...images];
              newImages[index] = result.assets[0];
              setImages(newImages);
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

  // Fix the startManualEntry function to properly initialize manual products
  const startManualEntry = () => {
    setIsManualProduct(true);
    Alert.alert(
      "Manual Product Entry",
      "Choose how you want to add product images",
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
          text: "No Image",
          onPress: () => {
            // Create a blank product with no image
            setImages([null]); // Use null to indicate no image
            setAnalyzedResults([{
              isManual: true,
              productName: "",
              description: "",
              price: "",
              isValid: true
            }]);
            setEditMode(true);
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // Modify handleAddMore to include manual option
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
          text: "No Image",
          onPress: () => {
            // Add a blank manual product with no image
            setImages(prevImages => [...prevImages, null]); // Add null to images array
            setAnalyzedResults(prevResults => [
              ...prevResults,
              {
                isManual: true,
                productName: "",
                description: "",
                price: "",
                isValid: true
              }
            ]);
            setEditMode(true);
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // Add the missing handleDeleteImage function
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
      setIsManualProduct(false);
    }
  };

  // Add the missing handleReplaceImage function
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

  // Add the missing replaceAndAnalyzeImage helper function
  const replaceAndAnalyzeImage = async (index, newImage) => {
    // Replace the image at the specified index
    const newImages = [...images];
    newImages[index] = newImage;
    setImages(newImages);
    
    // If this is a manual product, just update the image
    if (analyzedResults[index]?.isManual) {
      return;
    }
    
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
        {/* Credit counter only on main screen */}
        {images.length === 0 && analyzedResults.length === 0 && (
          <TouchableOpacity 
            className="absolute top-40 right-20 z-10 bg-blue-100 px-3 py-1 rounded-full flex-row items-center"
            onPress={navigateToBuyCredits}
          >
            <Text className="font-bold text-blue-600">{credits} Credits</Text>
          </TouchableOpacity>
        )}

        {images.length === 0 && analyzedResults.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            
            {/* Only show the two main options */}
            <View className="w-full px-6 mb-8">
              <TouchableOpacity 
                className="bg-blue-500 py-4 px-6 rounded-lg items-center mb-4 w-full"
                onPress={() => {
                  setIsManualProduct(false);
                  Alert.alert(
                    "AI Product Upload",
                    "Choose how you want to add product images",
                    [
                      {
                        text: "Camera",
                        onPress: () => {
                          setIsManualProduct(false);
                          openCamera();
                        }
                      },
                      {
                        text: "Gallery",
                        onPress: () => {
                          setIsManualProduct(false);
                          pickImages();
                        }
                      },
                      {
                        text: "Cancel",
                        style: "cancel"
                      }
                    ]
                  );
                }}
                disabled={isLoading}
              >
                <Text className="text-white font-bold text-lg">Upload Products Using AI</Text>
                <Text className="text-white text-xs mt-1">(Uses Credits)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-gray-200 py-4 px-6 rounded-lg items-center w-full"
                onPress={startManualEntry}
                disabled={isLoading}
              >
                <Text className="text-gray-800 font-bold text-lg">Manual Upload</Text>
                <Text className="text-gray-600 text-xs mt-1">(No Credits Required)</Text>
              </TouchableOpacity>
            </View>
            
            {/* Remove the secondary camera/gallery buttons */}
            
            <Text className="text-gray-500 text-center px-6">
              AI Upload: Our AI analyzes your products automatically
            </Text>
            <Text className="text-gray-500 text-center px-6 mt-2">
              Manual Upload: Enter product details yourself
            </Text>
            
            {credits <= 0 && (
              <TouchableOpacity 
                className="bg-blue-500 py-2 px-4 rounded-lg mt-6"
                onPress={navigateToBuyCredits}
              >
                <Text className="text-white font-semibold">Buy AI Credits</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListHeaderComponent={
                <View className="mb-4 mt-40">
                  <TouchableOpacity 
                    className="bg-gray-200 py-2 px-4 rounded-lg self-start"
                    onPress={() => {
                      Alert.alert(
                        "Return to Main Screen?",
                        "All current product drafts will be lost. Are you sure you want to continue?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel"
                          },
                          {
                            text: "Yes, Discard Drafts",
                            onPress: () => {
                              setImages([]);
                              setAnalyzedResults([]);
                              setEditMode(false);
                              setIsManualProduct(false);
                            },
                            style: "destructive"
                          }
                        ]
                      );
                    }}
                  >
                    <Text className="text-gray-800">← Back to Main</Text>
                  </TouchableOpacity>
                </View>
              }
            />
            
            <View className="absolute bottom-4 left-0 right-0 items-center">
              {!isLoading && !isKeyboardVisible && (
                <View className="flex-row space-x-4">
                  {/* Only show Analyze Images if there are unanalyzed images AND we're not in manual mode */}
                  {images.length > 0 && analyzedResults.length < images.length && !isManualProduct && (
                    <TouchableOpacity 
                      className="bg-blue-500 py-3 px-6 rounded-full"
                      onPress={handleUpload}
                      disabled={isLoading}
                    >
                      <Text className="text-white font-bold text-lg">Analyze Images</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show Upload Products if there are any analyzed or manual products */}
                  {analyzedResults.length > 0 && (
                    <TouchableOpacity 
                      className="bg-green-600 py-3 px-6 rounded-full"
                      onPress={handleUploadProducts}
                    >
                      <Text className="text-white font-bold text-lg">Upload Products</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    className="bg-green-500 py-3 px-6 rounded-full"
                    onPress={handleAddMore}
                    disabled={isLoading}
                  >
                    <Text className="text-white font-bold text-lg">Add More</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {isLoading && (
                <View className="items-center justify-center py-4 bg-white rounded-lg shadow-md px-6">
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text className="mt-2">
                    {progress.isUploading 
                      ? `Uploading products... ${progress.current}/${progress.total}`
                      : `Analyzing images... ${progress.current}/${progress.total}`}
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
