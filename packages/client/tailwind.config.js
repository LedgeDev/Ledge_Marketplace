const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/dist/tailwind')],
  theme: {
    extend: {
      colors: {
        'black': {
          DEFAULT: '#000000',
          600: '#00000099',
        },
        'blue': {
          DEFAULT: '#13476C',
          100: '#13476C1A',
          180: '#13476C2E',
          300: '#13476C4D',
          600: '#13476C99'
        },
        'blue-light': '#D5DEE5',
        'pink-light': '#FBEDED',
        'pink': {
          DEFAULT: '#F2C2C3',
          300: '#F2C2C34D',
        },
        'pink-dark': '#C359AC',
        'purple': '#8A8CD9',
        'purple-light': '#B9BADE',
        'purple-lighter': '#E8E8F6',
        'gray': {
          DEFAULT: '#F1F1F1',
          600: '#262C3099',
          200: '#F1F1F12E',
          400: '#F1F1F14D',
          500: '#F1F1F15D',
          700: '#F1F1F17D',
        },
        'grey': '#F1F1F1',
        'cream': '#FCFBF8',
        'white': '#FFFFFF',
        'ledge-black': '#262C30',
        'ledge-pink': '#C359AC',
        'correct': '#26AB4A',
        'incorrect': '#F20D51',
        'red': '#F95252',
        'red-dark': '#C00000',
        'gray-dark': '#262C30',
      },
      fontFamily: {
        'montserrat-alt': ['MontserratAlternates-Regular', 'sans-serif'],
        'montserrat-alt-bold': ['MontserratAlternates-Bold', 'sans-serif'],
        'montserrat-alt-semi-bold': ['MontserratAlternates-SemiBold', 'sans-serif'],
        'montserrat-alt-extra-light': [
          'MontserratAlternates-ExtraLight',
          'sans-serif',
        ],
        montserrat: ['Montserrat-Regular', 'sans-serif'],
        'montserrat-bold': ['Montserrat-Bold', 'sans-serif'],
        'montserrat-medium': ['Montserrat-Medium', 'sans-serif'],
        inter: ['Inter-Medium', 'sans-serif'],
        'inter-regular': ['Inter-Regular', 'sans-serif'],
        'inter-light': ['Inter-Light', 'sans-serif'],
        'inter-thin': ['Inter-Thin', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '4rem',
      },
      width: {
        '80p': '87%',
        97: '97%',
        42: '10.5rem',
      },
      height: {
        42: '10.5rem',
      },
      text: {
        'mdlarge': '1.25rem',
      },
      spacing: {
        1.75: '0.4375rem',
      },
      fontSize: {
        footnote: '0.75rem',
        subtitle: '0.875rem',
        smedium: '0.95rem',
        h2: '1.25rem',
        h3: '1.125rem',
      },
      lineHeight: {
        xsmall: '1.225rem',
        small: '1.125rem',
        normal: 'normal',
      },
      letterSpacing: {
        default: '0rem',
      },
      fontWeight: {
        normal: 400,
        bold: 700,
      },
      typography: (theme) => ({
        'subtitle-regular': {
          fontSize: theme('fontSize.subtitle'),
          fontWeight: theme('fontWeight.normal'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'subtitle-emphasized': {
          fontSize: theme('fontSize.subtitle'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'footnote-regular': {
          fontSize: theme('fontSize.footnote'),
          fontWeight: theme('fontWeight.normal'),
          lineHeight: theme('lineHeight.xsmall'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'body-regular': {
          fontSize: theme('fontSize.subtitle'),
          fontWeight: theme('fontWeight.normal'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'body-emphasized': {
          fontSize: theme('fontSize.subtitle'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'title2-emphasized': {
          fontSize: theme('fontSize.h2'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
        'title3-emphasized': {
          fontSize: theme('fontSize.h3'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.normal'),
          letterSpacing: theme('letterSpacing.default'),
        },
      }),
    },
  },
  plugins: [
    plugin(function ({ addUtilities, theme }) {
      const newUtilities = {
        '.typography-subtitle-regular': theme('typography.subtitle-regular'),
        '.typography-subtitle-emphasized': theme(
          'typography.subtitle-emphasized',
        ),
        '.typography-footnote-regular': theme('typography.footnote-regular'),
        '.typography-body-regular': theme('typography.body-regular'),
        '.typography-body-emphasized': theme('typography.body-emphasized'),
        '.typography-title2-emphasized': theme('typography.title2-emphasized'),
        '.typography-title3-emphasized': theme('typography.title3-emphasized'),
      };
      addUtilities(newUtilities);
    }),
  ],
};
