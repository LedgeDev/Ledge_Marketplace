import { useState, useEffect } from 'react';
import mediaUrl from '../utils/media-url';

export const usePreloadMedia = (brands) => {
  const [preloadedUrls, setPreloadedUrls] = useState(new Map());
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const loadSingleMedia = async (mediaPath, urlMap, brandId, mediaType, index = '') => {
      try {
        const url = await mediaUrl(mediaPath);
        const key = `${brandId}-${mediaType}${index}`;
        urlMap.set(key, url);
      } catch (error) {
        console.error(`Error preloading ${mediaType} for brand ${brandId}:`, error);
      }
    };

    const preloadMedia = async () => {
      if (!brands?.length) return;

      setIsPreloading(true);
      const urlMap = new Map();

      const preloadPromises = brands.flatMap(brand => {
        const promises = [];

        // Preload teaser if exists
        if (brand.teaser) {
          promises.push(loadSingleMedia(brand.teaser, urlMap, brand.id, 'teaser'));
        }

        // Preload images
        const imagePromises = brand.images.map((image, index) =>
          loadSingleMedia(image, urlMap, brand.id, 'image', `-${index}`)
        );
        promises.push(...imagePromises);

        // Preload founder image if exists
        if (brand.founders?.[0]?.image) {
          promises.push(loadSingleMedia(brand.founders[0].image, urlMap, brand.id, 'founder'));
        }

        return promises;
      });

      try {
        await Promise.all(preloadPromises);
        setPreloadedUrls(urlMap);
      } catch (error) {
        console.error('Error during media preloading:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadMedia();
  }, [brands]);

  const getMediaUrl = (brandId, type, index = 0) => {
    const key = type === 'teaser'
      ? `${brandId}-teaser`
      : type === 'founder'
        ? `${brandId}-founder`
        : `${brandId}-image-${index}`;

    return preloadedUrls.get(key);
  };

  return {
    isPreloading,
    getMediaUrl,
    preloadedUrls
  };
};
