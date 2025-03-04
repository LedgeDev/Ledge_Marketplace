import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import progressiveMediaUrl from '../utils/progressive-media-url';


const ExtImage = ({
  source,
  resizeMode,
  className,
  style,
  alt,
  onLoadEnd = () => {},
  onLoad = () => {},
  onError = () => {},
  mediaSource,
  quality = null,
  transparent = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [mediaSourceUrls, setMediaSourceUrls] = useState([]);
  const [loadedQualities, setLoadedQualities] = useState([]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  }

  const handleError = () => {
    setError(true);
    onError();
  }

  const hideQuality = (index) => {
    // If there is some higher quality loaded, hide this quality
    if (loadedQualities.slice(index + 1).some((loaded) => loaded)) {
      return true;
    }
    return false;
  }

  // manually execute onLoadEnd when all qualities are loaded
  useEffect(() => {
    if (loadedQualities.every(q => q)) {
      onLoadEnd();
    }
  }, [loadedQualities])

  useEffect(() => {
    const loadMediaSourceUrls = async () => {
      const sources = progressiveMediaUrl(mediaSource, quality);
      // urls are ordered from lowest to highest quality
      setLoadedQualities(Array(sources.length).fill(false));
      setMediaSourceUrls(sources);
    };

    if (mediaSource) {
      loadMediaSourceUrls();
    }
  }, [mediaSource]);

  const renderQualityItem = (url, index) => (
    <View key={url + index} className={`absolute top-0 left-0 right-0 bottom-0 justify-center items-center`} style={{ display: hideQuality(index) ? 'none' : 'block'}}>
      <Image
        className={"absolute top-0 left-0 right-0 bottom-0"}
        key={'image' + url + index}
        source={{ uri: url }}
        resizeMode={resizeMode}
        style={style}
        onLoad={handleLoad}
        onLoadEnd={() => {
          setLoadedQualities((prev) => {
            const newQualities = [...prev];
            newQualities[index] = true;
            return newQualities;
          });
        }}
        alt={alt}
        blurRadius={index === mediaSourceUrls.length - 1 ? 0 : 2}
      />
      {!(index === mediaSourceUrls.length - 1) && (
        <ActivityIndicator color="#999999" key={'indicator' + url + index} />
      )}
    </View>
  );

  const renderHighestLoadedQuality = () => {
    return (
      <>
        {Array.isArray(mediaSourceUrls) && mediaSourceUrls.map(renderQualityItem)}
      </>
    );
  };

  if (source) {
    return (
      <View className={`${className} relative flex justify-center items-center`} style={style}>
        {!(source?.uri) && <View className={`${className} bg-gray`} style={style} />}
        {(source?.uri) && !loaded && <ActivityIndicator color="#999999" className="absolute top-50 left-50" />}
        {(source?.uri) && (
          <Image
            className={className}
            source={source}
            resizeMode={resizeMode}
            style={style}
            onLoad={handleLoad}
            onError={handleError}
            onLoadEnd={onLoadEnd}
            alt={alt}
          />
        )}
      </View>
    );
  } else if (mediaSource) {
    return (
      <View className={`${className} relative flex justify-center items-center overflow-hidden ${!transparent && 'bg-gray'}`} style={style}>
        {!loaded && (
          <ActivityIndicator className="absolute top-50 left-50" color="#999999" />
        )}
        <View className="absolute top-0 left-0 right-0 bottom-0">
          {renderHighestLoadedQuality()}
        </View>
      </View>
    );
  }

};

export default ExtImage;
