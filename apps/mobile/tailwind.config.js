/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0875D1',
        secondary: '#0D9488',
        background: '#F6F8FC',
        surface: '#FFFFFF',
        destructive: '#D92D20',
        warning: '#B54708',
        muted: '#667085',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
};
