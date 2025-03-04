import React from 'react';
import { View } from 'react-native';
import { bgColors } from './avatarParts';
import {
  baseAssets,
  accessoryAssets,
  eyeAssets,
  faceAssets,
  hairAssets,
  mouthAssets,
  outfitAssets,
  facialHairAssets,
} from './assetsMapping';

const Part = ({ src, type, size = 320 }) => {
  const assetMappings = {
    body: baseAssets,
    accessories: accessoryAssets,
    eyes: eyeAssets,
    head: faceAssets,
    hair: hairAssets,
    mouth: mouthAssets,
    outfit: outfitAssets,
    "facial-hair": facialHairAssets,
  };

  if (!type || !src || !assetMappings[type]) {
    console.warn(`Invalid asset request - type: ${type}, src: ${src}`);
    return null;
  }

  const filename = src.split('/').pop();
  const SvgComponent = assetMappings[type][filename];
  if (!SvgComponent) {
    console.warn(`Asset lookup failed for type "${type}" with filename "${filename}"`);
    return null;
  }

  // Calculate scale based on size
  const scale = size / 320;

  const style = {
    position: 'absolute',
    transform: [
      { scale: type === 'body' ? 0.8 * scale : scale },
      { translateY: 10 * scale },
      ...(type === 'outfit' ? [{ translateY: 35 * scale }, { translateX: -10 * scale }] : []),
      ...(type === 'body' ? [{ translateY: 25 * scale }, { translateX: -10 * scale }] : []),
    ],
  };

  return (
    <SvgComponent
      width="100%"
      height="100%"
      style={style}
    />
  );
};

export const AvatarCanvas = React.forwardRef(
  ({ bg, hair, eyes, mouth, head, outfit, body, accessories, facialHair, size = 320, containerSize, offsetX = 0 }, ref) => {
    const renderAvatarPart = (part, type) => {
      if (!part) return null;
      return <Part key={type} src={part.src} type={type} size={size} />;
    };

    // If containerSize is not provided, use the size prop
    const finalContainerSize = containerSize || size;
    // Calculate offset to center the avatar in the container
    const offset = (finalContainerSize - size) / 2;

    return (
      <View
        ref={ref}
        style={{
          width: finalContainerSize,
          height: finalContainerSize,
          overflow: 'hidden',
          backgroundColor: bgColors[bg],
          borderRadius: finalContainerSize / 2,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <View style={{
          width: size,
          height: size,
          position: 'relative',
          transform: [
            { translateX: (-15 * (size/320)) + offsetX },
          ]
        }}>
          {renderAvatarPart(body, "body")}
          {renderAvatarPart(outfit, "outfit")}
          {renderAvatarPart(head, "head")}
          {renderAvatarPart(facialHair, "facial-hair")}
          {renderAvatarPart(eyes, "eyes")}
          {renderAvatarPart(mouth, "mouth")}
          {renderAvatarPart(hair, "hair")}
          {renderAvatarPart(accessories, "accessories")}
        </View>
      </View>
    );
  }
);
