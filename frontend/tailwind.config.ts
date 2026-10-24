import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        app: '#06100B',
        sidebar: '#08110D',
        panel: '#0B1510',
        cardRaised: '#101B14',
        cardHover: '#17251A',
        greenDeep: '#14280F',
        greenActive: '#28451D',
        lime: {
          DEFAULT: '#C7F451',
          hover: '#B5E23F',
          soft: '#A9D83C',
        },
        mint: {
          DEFAULT: '#87E5CB',
          soft: '#A5F0DC',
        },
        ink: {
          DEFAULT: '#F4F7F0',
          primary: '#F4F7F0',
          secondary: '#ADB6AA',
          muted: '#7E897E',
        },
        inkMuted: '#7E897E',
        borderSubtle: '#1D2B20',
        danger: {
          DEFAULT: '#FF6464',
          muted: '#3D1B1B',
        },
        success: {
          DEFAULT: '#8FE36A',
          muted: '#183318',
        },
        // Backwards compatibility aliases
        forest: {
          DEFAULT: '#14280F',
          deep: '#08110D',
          light: '#28451D',
        },
        surface: {
          DEFAULT: '#0B1510',
          muted: '#101B14',
        },
        surfaceAlt: '#101B14',
        page: '#06100B',
      },
      borderRadius: {
        card: '18px',
        control: '12px',
        hero: '22px',
      },
      boxShadow: {
        glow: '0 0 30px -5px rgba(199, 244, 81, 0.15)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
