const backgrounds = [
  "bg-red-300",
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300"
];

const randomPart = (src, qty) => {
  const randomIndex = Math.floor(Math.random() * qty) + 1;
  const formattedIndex = randomIndex.toString().padStart(2, "0");
  return `${src}${formattedIndex}`;
};

export function getRandomAvatar(overrides = {}) {
  return {
    bg: backgrounds[Math.floor(Math.random() * backgrounds.length)],
    body: { src: "base/Body" },
    hair: { src: randomPart("hairs/Hair", 32) },
    eyes: { src: randomPart("eyes/Eye", 6) },
    mouth: { src: randomPart("mouths/Mouth", 10) },
    head: { src: randomPart("faces/Face", 8) },
    outfit: { src: randomPart("outfits/Outfit", 25) },
    accessories: { src: randomPart("accessories/Accessory", 10) },
    facialHair: { src: randomPart("facial-hair/FacialHair", 8) },
    ...overrides,
  };
}
