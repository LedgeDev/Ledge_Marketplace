import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import ExtImage from '../../components/ExtImage';
import globalStyles from "../../assets/styles/globalStyles";

const { width, height } = Dimensions.get('window');

function BrandCardScreen({ brand }) {

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ExtImage
          style={[styles.image, { width: width * 0.9, height: height * 0.25 }]}
          mediaSource={brand.image}
        />
        <View style={styles.brandNameContainer}>
          <Text style={[globalStyles.normalText, styles.brandNameText]}>{brand.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  image: {
    borderRadius: 15,
    marginBottom: 8,
  },
  brandNameContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 5,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  brandNameText: {
    color: 'black',
  },
});

export default BrandCardScreen;
