import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        sunnyorange: '#FFB944',
        sunnycarrot: '#FF7A00',
        lucidviolet: {
          50: '#f4f5f9',
          100: '#ebedf4',
          200: '#dadceb',
          300: '#c3c7de',
          400: '#aaabcf',
          500: '#9594c0',
          600: '#827caf',
          700: '#706a98',
          800: '#5c577c',
          900: '#4c4a65',
          950: '#2d2b3b',
        },
        lucid: {
          light: '#fafaff',
          violetgray: '#7E7F99',
        },
        lucidgray: {
          light: '#E6E6E6',
          medium: '#BBBBBB',
          dark: '#6D6D6D',
        },
        potential: {
          normal: '#C5C5C5',
          rare: '#4BB3F8',
          epic: '#DE7FFF',
          unique: '#F8D000',
          legendary: '#2AF42B',
          exceptional: '#FF2E2E',
          expired: '#FF7A00',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          '"Pretendard"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
    },
  },
}
