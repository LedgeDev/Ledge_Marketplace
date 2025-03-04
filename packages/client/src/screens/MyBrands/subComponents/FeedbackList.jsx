import React from 'react';
import { View, Text } from 'react-native';

const FeedbackList = ({ brand, t }) => {
  const selectedFeedback = brand.usersFeedback
    ?.filter(feedback => feedback.index !== null)
    ?.sort((a, b) => a.index - b.index) || [];

  return (
    <>
      {selectedFeedback.length > 0 ? (
        <View className="w-full self-center bg-[transparent] rounded-xl mt-4">
          {selectedFeedback.map((feedback, i) => (
            <View
              key={i}
              className={`mb-4 ${i % 2 === 0 ? 'left-0 items-start' : 'right-0 items-end'}`}
            >
              <View className="flex-row items-end">
                <Text className="font-montserrat-alt-normal text-s max-w-[60%]">{`"${feedback.text}"`}</Text>
                {feedback.name ? (
                  <Text className="font-montserrat-alt-normal text-xs text-gray-500 ml-2">{`- ${feedback.name}`}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="w-full p-4 self-center bg-white rounded-xl mt-4">
          <Text className="font-montserrat-alt-bold text-s self-center">{t('brandProfile.noUsersfeedback')}</Text>
        </View>
      )}
    </>
  );
};

export default FeedbackList;
