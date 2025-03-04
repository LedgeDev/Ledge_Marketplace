/**
 * Returns an object with colors for the level, with the following properties:
 * - bg: background color
 * - lightBg: light background color
 * - textBg: text background color
 * - text: text color
 * @param {number} order - The order of the level
 * @returns {Object} - An object with colors for the level
 */
export default function levelColors(order) {
  let colors = {};
  switch (order) {
    case 1:
      // green
      colors = {
        bg: '#769774',
        textBg: '#D1DDD1',
        dark: '#25521D'
      };
      break;
    case 2:
      // blue
      colors = {
        bg: '#7990A5',
        textBg: '#D2DAE1',
        dark: '#244669'
      };
      break;
    case 3:
      // orange
      colors = {
        bg: '#D1A06F',
        textBg: '#F0E0CE',
        dark: '#B56323'
      };
      break;
    case 4:
      // fuchsia
      colors = {
        bg: '#A36EA9',
        textBg: '#DFCFE2',
        dark: '#6B1673'
      };
      break;
    default:
      // purple
      colors = {
        bg: '#BFC0E6', // background
        textBg: '#E8E8F6', // text background
        dark: '#8A8CD4' // waves and text
      };
      break;
    }
  return colors;
}