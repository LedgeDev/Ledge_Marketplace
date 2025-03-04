import React from "react";
import { View, Text, Image, Platform } from "react-native";
import { BlurView } from "expo-blur";
import ArrowLineUp from "../../assets/svg/arrow-line-up-grey.svg";

const useBlur = Platform.OS === "ios";

function ForYouInfoBlur({ className }) {
  return (
    <View
      className={`absolute -top-10 left-0 right-0 bottom-0 w-full flex-col justify-center items-center ${className}`}
      pointerEvents="box-none"
    >
      { useBlur ? (
        <BlurView
          className="absolute w-full h-full"
          intensity={40}
          tint="light"
        />
      ) : (
        <View
          className="absolute w-full h-full bg-cream"
        />
      )}
      <View
        className="absolute w-full h-full bg-cream opacity-50"
      />
      <View className="justify-center items-center px-16 gap-8">
        <ArrowLineUp width={30} height={30} />
        <Text className="text-blue text-xl font-montserrat-alt-bold text-center">
          Discover more brands by connecting with the founders above
        </Text>
        <Image
          source={require("../../assets/images/phone-usage.png")}
          resizeMode="contain"
          className="w-56 h-56"
        />
        <Text className="text-blue font-inter-regular text-center">
          More 'For You' brands are waiting once you've connected with these founders.
        </Text>
      </View>
    </View>
  );
}

export default ForYouInfoBlur;