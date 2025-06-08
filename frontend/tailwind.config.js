/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Adjusted to look in src directory
  ],
  theme: {
    extend: {
      animation: {
        modalOpen: 'modalOpen 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
      },
      keyframes: {
        modalOpen: {
          from: { transform: 'translateY(-20px) scale(0.98)', opacity: '0' },
          to: { transform: 'translateY(0) scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}