/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1F2937',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
