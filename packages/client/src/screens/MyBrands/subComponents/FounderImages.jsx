import React from "react";
import { View, Text, Image } from "react-native";
import ExtImage from "../../../components/ExtImage";
import getFounderNamesString from "../../../utils/founder-names-string";

function OneFounder({ founder, showNames, showChristmasHat }) {
  return(
    <View className="relative flex-1 flex-col justify-center items-center gap-1">
      <View>
        <ExtImage
          className="rounded-full w-full h-full aspect-square"
          mediaSource={founder.image}
          quality="medium"
        />
        {showChristmasHat && (
          <View className="absolute -top-[32] -right-[17] w-full h-full">
            <Image
              source={ChristmasHat}
              resizeMode="contain"
              className="w-full h-full"
            />
          </View>
        )}
      </View>
      {showNames && (
        <Text
          className="font-montserrat-alt text-xs text-black-600 text-center w-full"
          adjustsFontSizeToFit
        >
          {founder.name}
        </Text>
      )}
    </View>
  )
}

function TwoFounders({ founders, showNames, showChristmasHat }) {
  return (
    <View className="relative flex flex-col justify-center items-center flex-1 gap-1">
      <View className="relative flex-col justify-center items-center flex-1 w-full min-h-16">
        <View className="absolute left-0 w-2/3 aspect-square">
          <ExtImage
            mediaSource={founders[0].image}
            resizeMode="cover"
            className="rounded-full w-full aspect-square border border-1 border-white"
            quality="medium"
          />
        </View>
        {showChristmasHat && (
            <View className="absolute -top-[23] -right-[0] w-full h-full">
              <Image
                source={ChristmasHat}
                resizeMode="contain"
                className="w-full h-full"
              />
            </View>
          )}
        <View className="absolute right-0 w-2/3 aspect-square">
          <ExtImage
            mediaSource={founders[1].image}
            resizeMode="cover"
            className="rounded-full w-full aspect-square border border-1 border-white"
            quality="medium"
          />
          {showChristmasHat && (
            <View className="absolute -top-[20] -right-[10] w-full h-full z-30">
              <Image
                source={ChristmasHat}
                resizeMode="contain"
                className="w-full h-full"
              />
            </View>
          )}
        </View>
      </View>
      {showNames && (
        <Text
          className="font-montserrat-alt text-xs text-black-600 text-center w-full"
          adjustsFontSizeToFit
        >
          {getFounderNamesString(founders.map(founder => founder.name))}
        </Text>
      )}
    </View>
  );
}

function ThreeFounders({ founders, showNames, showChristmasHat }) {
  return (
    <View className="flex flex-col justify-center items-center flex-1 gap-1">
      <View className="relative flex-col justify-center items-center flex-1 w-full min-h-24">
        <View className="absolute top-0 left-0 w-2/3 aspect-square">
          <ExtImage
            mediaSource={founders[0].image}
            resizeMode="cover"
            className="rounded-full w-full aspect-square border border-1 border-white"
            quality="medium"
          />
          {showChristmasHat && (
            <View className="absolute -top-[20] -right-[10] w-full h-full z-30">
              <Image
                source={ChristmasHat}
                resizeMode="contain"
                className="w-full h-full"
              />
            </View>
          )}
        </View>
        <View className="absolute top-0 right-0 w-2/3 aspect-square">
          <ExtImage
            mediaSource={founders[1].image}
            resizeMode="cover"
            className="rounded-full w-full aspect-square border border-1 border-white"
            quality="medium"
          />
          {showChristmasHat && (
            <View className="absolute -top-[20] -right-[10] w-full h-full z-30">
              <Image
                source={ChristmasHat}
                resizeMode="contain"
                className="w-full h-full"
              />
            </View>
          )}
        </View>
        <View className="absolute bottom-0 w-2/3 aspect-square">
          <ExtImage
            mediaSource={founders[2].image}
            resizeMode="cover"
            className="rounded-full w-full aspect-square border border-1 border-white"
            quality="medium"
          />
          {showChristmasHat && (
            <View className="absolute -top-[20] -right-[10] w-full h-full z-30">
              <Image
                source={ChristmasHat}
                resizeMode="contain"
                className="w-full h-full"
              />
            </View>
          )}
        </View>
      </View>
      {showNames && (
        <Text
          className="font-montserrat-alt text-xs text-black-600 text-center w-full"
          adjustsFontSizeToFit
        >
          {getFounderNamesString(founders.map(founder => founder.name))}
        </Text>
      )}
    </View>
  );
}

function FounderImages({ brand, showNames = false, showChristmasHat = false }) {
  switch (brand.founders.length) {
    case 1:
      return (
        <OneFounder
          founder={brand.founders.slice(0, 1)[0]}
          showNames={showNames}
          showChristmasHat={showChristmasHat}
        />
      );
    case 2:
      return(
        <TwoFounders
          founders={brand.founders.slice(0, 2)}
          showNames={showNames}
          showChristmasHat={showChristmasHat}
        />
      );

    default:
      return (
        <ThreeFounders
          founders={brand.founders.slice(0, 3)}
          showNames={showNames}
          showChristmasHat={showChristmasHat}
        />
      );
  }
};

export default FounderImages;
