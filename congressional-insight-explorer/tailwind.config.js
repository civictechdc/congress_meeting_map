/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#1e3a8a',
        'secondary-blue': '#3b82f6',
        'accent-amber': '#f59e0b',
        'cluster': {
          'appropriations': '#059669',
          'oversight': '#dc2626',
          'hearings': '#7c3aed',
          'witness': '#ea580c',
          'metadata': '#0891b2',
          'joint': '#65a30d',
          'print': '#be123c',
          'capacity': '#4338ca',
          'reports': '#a21caf',
        }
      },
      fontFamily: {
        'heading': ['Inter', 'sans-serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
