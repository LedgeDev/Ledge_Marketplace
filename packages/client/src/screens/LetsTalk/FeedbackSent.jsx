import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/Button';
import { useTranslation } from '../../hooks/useTranslation';
import PaperPlane from '../../assets/svg/paperPlane.svg';


function FeedbackSent({ feedbackExamples, onSendFeedback }) {
  const { t } = useTranslation();
  // here we try to mimic a random horizontal positioning of the feedback example list.
  // for each item, we will select a random flex justify property and a random margin property
  // then we apply these properties to the items
  const itemFlexProps = useMemo(() => {
    const itemProps = [
      "justify-start",
      "justify-center",
      "justify-end",
    ]
    const getRandomItemFlexProps = () => {
      const index = Math.floor(Math.random() * 3);
      return itemProps[index];
    }
    return Array.from({ length: feedbackExamples.length }, () => getRandomItemFlexProps());
  }, [feedbackExamples]);

  const itemMarginProps = useMemo(() => {
    const getRandomItemMarginProps = () => {
      const marginLeft = Math.floor(Math.random() * 5);
      const marginRight = Math.floor(Math.random() * 5);
      return `ml-${marginLeft * 5} mr-${marginRight * 5}`;
    }
    return Array.from({ length: feedbackExamples.length }, () => getRandomItemMarginProps());
  }, [feedbackExamples]);

  const getFirstLine = useCallback((text) => {
    // get the first line of the text
    return text.split("\n")[0];
  }, []);

  const renderFeedbacks = useCallback(() => {
    return feedbackExamples.map((example, index) => (
      <View key={index} className={`flex-row items-center px-4 py-2 ${itemFlexProps[index]} ${itemMarginProps[index]}`}>
        <Text className="text-lg">
          "{getFirstLine(example.text)}..."
          { example.user?.name?.length > 0 && (
            <Text className="text-sm text-gray-600"> - {example.user.name}</Text>
          )}
        </Text>
      </View>
    ));
  }, [feedbackExamples]);

  const renderBlur = useCallback((top) => {
    const colors = top ? ['#FCFBF8', '#FCFBF800'] : ['#FCFBF800', '#FCFBF8']
    if (Platform.OS === 'android') {
      return (
        <LinearGradient
          colors={colors}
          style={{
            height: '100%',
            width: '100%',
            zIndex: 30,
          }}
        />
      )
    }
    return (
      <BlurView intensity={5} className="h-full w-full z-30">
        <LinearGradient
          colors={colors}
          style={{
            height: '100%',
            width: '100%',
            zIndex: 20,
          }}
        />
      </BlurView>
    )
  }, []);

  return (
    <View className="relative flex-1 justify-center items-stretch h-full px-7 pt-4">
      <Text className="font-montserrat-alt-bold text-2xl mb-4">{t("letsTalk.connect.otherFeedback")}:</Text>
      <View className="relative flex-1 overflow-hidden mb-4">
        <View className="absolute top-0 left-0 right-0 h-12 z-30">
          {renderBlur(true)}
        </View>
        <ScrollView
          className="h-full z-10"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingTop: 48, paddingBottom: 48 }} // height of blur is 12 rem
        >
          {renderFeedbacks()}
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 h-12 z-30">
          {renderBlur(false)}
        </View>
      </View>
      <Image
        source={require('../../assets/images/zach-and-vali-plain.jpeg')}
        className="w-32 h-32 rounded-full self-center mb-4"
      />
      <Button
        className="mb-12 self-center"
        prependIcon={<PaperPlane width={20} height={20} />}
        color="pink"
        onPress={onSendFeedback}
      >
        <Text className="text-ledge-pink">
          {t("letsTalk.connect.moreFeedback")}
        </Text>
      </Button>
    </View>
  );
}

export default FeedbackSent;
