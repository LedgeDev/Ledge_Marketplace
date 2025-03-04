import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import ExtImage from './ExtImage';
import { likePost } from '../store/models/posts';
import { useSelector, useDispatch } from 'react-redux';
import { Video, ResizeMode } from 'expo-av';
import mediaUrl from '../utils/media-url';
import LedgeLogoPink from '../assets/logos/logo_pink.png';
import HeartOutlineGray from '../assets/svg/heart-outline-gray.svg';
import HeartOutlinePink from '../assets/svg/heart-outline-pink.svg';
import PlayPitch from '../assets/svg/playPitch.svg';
import PausePitch from '../assets/svg/pausePitch.svg';
import MuteButton from './MuteButton';
import NewDotIndicator from './NewDotIndicator';

const videoBorderRadius = 16;
const playButtonSize = 40;

function VideoWrapper({ videoRef, isPlaying, isMuted, onMute, children }) {
  const controlsVisible = useRef(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const controlsTimeout = useRef(null);

  // mute or unmute if isMuted changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(isMuted);
    }
  }, [isMuted]);

  const toggleControls = (value) => {
    if (value === true || value === false) {
      controlsVisible.current = value;
    } else {
      controlsVisible.current = !controlsVisible.current;
    }
    Animated.timing(overlayOpacity, {
      toValue: controlsVisible.current ? 0.5 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible.current ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    if (controlsVisible.current) {
      controlsTimeout.current = setTimeout(() => {
        toggleControls(false);
      }, 3000);
    }
  }

  const handlePlayPause = () => {
    Haptics.selectionAsync();
    toggleControls(true);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  };

  return (
    <View className="relative w-full h-full justify-center items-center">
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View className="absolute w-full h-full">
          {children}
          {/* overlay for controls contrast */}
          <Animated.View
            className="absolute w-full h-full bg-black"
            style={{ 
              opacity: overlayOpacity,
              borderRadius: videoBorderRadius
            }}
          />
        </View>
      </TouchableWithoutFeedback>
      <Animated.View style={{ opacity: controlsOpacity }}>
        <TouchableOpacity
          onPress={handlePlayPause}
          className="p-5 rounded-full"
        >
          {isPlaying ? (
            <PausePitch width={playButtonSize} height={playButtonSize} />
          ) : (
            <PlayPitch width={playButtonSize} height={playButtonSize} />
          )}
        </TouchableOpacity>
      </Animated.View>
      <MuteButton isMuted={isMuted} onMute={onMute} />
    </View>
  );
}

function PostAvatar({ post }) {
  if (post.brand) {
    const brandAvatar = post.brand.teamPicture ? post.brand.teamPicture : post.brand.brandLogo;
    return (
      <ExtImage
        mediaSource={brandAvatar}
        resizeMode='cover'
        className="w-[50] h-[50] rounded-full"
      />
    )
  }
  return (
    <Image
      source={LedgeLogoPink}
      resizeMode='contain'
      className="w-[50] h-[50] rounded-full"
    />
  );
};

function PostMedia({ post, visible, isMuted, onMute, shouldPlay }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadMediaUrls = async () => {
      if (post.video?.length) {
        const videoUrl = await mediaUrl(post.video);
        setImageUrl(null);
        setVideoUrl(videoUrl);
      } else if (post.image) {
        const imageUrl = post.image;
        setVideoUrl(null);
        setImageUrl(imageUrl);
      }
    };
    loadMediaUrls();
  }, [post]);

  useEffect(() => {
    const stopVideo = async () => {
      if (!visible && videoRef?.current) {
        await videoRef.current.setPositionAsync(0);
      }
    }
    stopVideo();
  }, [visible]);

  if (videoUrl) {
    return (
      <VideoWrapper videoRef={videoRef} isPlaying={playing} isMuted={isMuted} onMute={onMute}>
        <View className="relative w-full h-full">
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={visible && shouldPlay}
            isLooping
            useNativeControls={false}
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: videoBorderRadius }}
            onPlaybackStatusUpdate={(status) => {setPlaying(status.isPlaying)}}
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
          />
          {loading && (
            <View
              className="absolute w-full h-full justify-center items-center bg-gray"
              style={{ borderRadius: videoBorderRadius}}
            >
              <ActivityIndicator size="small" color="#999999" />
            </View>
          )}
        </View>
      </VideoWrapper>
    )
  } else if (imageUrl) {
    return (
      <ExtImage
        mediaSource={imageUrl}
        resizeMode="cover"
        style={{ width: '100%', height: '100%', borderRadius: 16 }}
      />
    )
  }
  return null;
}

function PostCard({ post, visible, isMuted, onMute, shouldPlay, isNew }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.users.data);
  const [isLiked, setIsLiked] = useState(post.userLikes?.some(u => u.id === user.id));

  const getFounderNames = () => {
    if (!post.brand?.founders) return 'ledge';

    const validFounders = post.brand.founders
      .map(founder => founder.name)
      .filter(name => name.trim() !== '');

    if (validFounders.length === 0) {
      return '';
    } else if (validFounders.length === 1) {
      return validFounders[0];
    } else {
      return validFounders.join(' & ');
    }
  };

  const handleLike = async () => {
    Haptics.selectionAsync();
    setIsLiked(!isLiked);
    let res;
    if (post.userLikes?.some(u => u.id === user.id)) {
      // unlike
      res = await dispatch(likePost({ id: post.id, like: false })).unwrap();
    } else {
      // like
      res = await dispatch(likePost({ id: post.id, like: true })).unwrap();
    }
    setIsLiked(res.userLikes?.some(u => u.id === user.id));
  }

  return (
    <View className="w-full h-full flex flex-col">
      <View className="flex-row items-center">
        <PostAvatar post={post} />
        <View className="flex-1 ml-5">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-montserrat-alt-bold">
              {post.title}
            </Text>
            <NewDotIndicator className="mt-0.5" show={isNew} />
          </View>
          <Text className="text-md text-gray-600 font-inter pb-1.5">
            {post.author ? post.author : getFounderNames()}
          </Text>
        </View>
      </View>
      <Text className="my-4">
        { post.content }
      </Text>
      <View className="flex-1">
        <PostMedia post={post} visible={visible} isMuted={isMuted} onMute={onMute} shouldPlay={shouldPlay} />
      </View>
      <View className="flex flex-row justify-start items-center mt-3 gap-3">
        <Text className="text-sm text-gray-600 font-inter">
          {new Date(post.createdAt).toLocaleString('en-GB', {
            timeZone: 'CET',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <TouchableOpacity
          className="flex flex-row items-center gap-1"
          onPress={handleLike}
          hitSlop={10}
        >
          {isLiked ? (
            <HeartOutlinePink />
          ) : (
            <HeartOutlineGray />
          )}
          <Text className="text-md text-gray-600 font-inter">
            {post.userLikes?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
