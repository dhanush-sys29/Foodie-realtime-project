/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',    // Warm Orange
        secondary: '#1A1A2E',  // Deep Navy
        accent: '#F5A623',     // Soft Gold
        background: '#FAFAFA', // Off-White
        success: '#22C55E',    // Green
        error: '#EF4444',      // Red
        textPrimary: '#1F2937', // Charcoal
        textSecondary: '#6B7280' // Gray
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        pacifico: ['Pacifico', 'cursive'],
      }
    },
  },
  plugins: [],
}
