import { useRef, useState } from "react";
import { backgrounds } from "./avatarParts";

const randomPart = (prefix, qty) =>
  `${prefix}${String(Math.floor(Math.random() * qty + 1)).padStart(2, "0")}`;

const getRandomAvatar = (overrides = {}) => {
  return {
    bg: backgrounds[Math.floor(Math.random() * backgrounds.length)],
    body: { src: "base/Body" },
    hair: { src: randomPart("hairs/Hair", 32) },
    eyes: { src: randomPart("eyes/Eye", 6) },
    mouth: { src: randomPart("mouths/Mouth", 10) },
    head: { src: randomPart("faces/Face", 8) },
    outfit: { src: randomPart("outfits/Outfit", 25) },
    accessories: { src: randomPart("accessories/Accessory", 18) },
    facialHair: { src: randomPart("facial-hair/FacialHair", 8) },
    ...overrides,
  };
};

export const useAvatar = () => {
  const [avatar, setAvatar] = useState(getRandomAvatar({
    bg: backgrounds[0],
  }));
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activePart, setActivePart] = useState("");
  const avatarCanvasRef = useRef(null);

  const handleRandomizeAvatar = () => {
    setUploadedImage(null);
    const newAvatar = getRandomAvatar();
    setAvatar(newAvatar);
    setActivePart("");
  };

  const handleImageUpload = (imageUri) => {
    setUploadedImage(imageUri);
    setAvatar(null);
    setActivePart("");
  };

  return {
    avatar,
    uploadedImage,
    activePart,
    avatarCanvasRef,
    setAvatar,
    handleRandomizeAvatar,
    handleImageUpload,
  };
};
