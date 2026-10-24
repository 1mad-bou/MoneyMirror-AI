import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#14270B',
          deep: '#0C1B08',
          light: '#233F14',
        },
        lime: {
          DEFAULT: '#B8E83D',
          hover: '#A6D52F',
        },
        mint: {
          DEFAULT: '#D8ECEA',
          soft: '#EAF4F3',
        },
        page: '#F2F3EE',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#E9EBE5',
        },
        ink: {
          DEFAULT: '#171A15',
          muted: '#74786F',
        },
        borderSubtle: '#E3E5DE',
        danger: '#C84646',
      },
      borderRadius: {
        card: '20px',
        control: '14px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
