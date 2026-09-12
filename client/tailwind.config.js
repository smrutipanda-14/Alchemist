/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0f0f1b',
          panel: '#1a1a2e',
          card: '#16213e',
          border: '#303a52',
          gold: '#f6c90e',
          magic: '#9d4edd',
          emerald: '#00b4d8',
          herbal: '#2ec4b6',
          potionRed: '#e63946',
          potionBlue: '#4361ee',
          potionGreen: '#06d6a0',
          potionPurple: '#7209b7'
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
