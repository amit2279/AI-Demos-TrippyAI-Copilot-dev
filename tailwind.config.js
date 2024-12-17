import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            p: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
            ul: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            ol: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
          },
        },
      },
    },
  },
  plugins: [
    typography(),
  ],
};