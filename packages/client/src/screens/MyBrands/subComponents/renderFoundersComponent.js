import React from 'react';
import OneFounder from './founder/oneFounder';
import TwoFounders from './founder/twoFounders';
import ThreeFounders from './founder/threeFounders';
import { ActivityIndicator } from 'react-native';

export const renderFoundersComponent = (founders, founderImageUrl, widthHeight) => {
  if (founderImageUrl.length === 0) {
    return <ActivityIndicator size="large" color="#C359AC" />;
  }
  switch (founders) {
    case 1:
      return (
        <OneFounder
        imageUrl={founderImageUrl.slice(0, 1)}
        className="rounded-full"
          style={{ width: widthHeight, height: widthHeight }}
        />
      );
    case 2:
      return (
        <TwoFounders
        imageUrl={founderImageUrl.slice(0, 2)}
        className="rounded-full"
          style={{ width: widthHeight, height: widthHeight }}
        />
      );
    default:
      return (
        <ThreeFounders
        imageUrl={founderImageUrl.slice(0, 3)}
        className="rounded-full"
          style={{ width: widthHeight, height: widthHeight }}
        />
      );
  }
};
