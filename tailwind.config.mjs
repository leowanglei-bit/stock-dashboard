/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 全部映射到 src/index.css 里已有的主题变量，避免两套色板
        bg: 'var(--background)',
        fg: 'var(--foreground)',
        brand: 'var(--primary)',
        'brand-dark': 'var(--primary-dark)',
        card: 'var(--card-bg)',
        line: 'var(--border-color)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
        rise: 'var(--rise-color)',
        fall: 'var(--fall-color)',
      },
      fontFamily: {
        sans: ['var(--font-family)'],
      },
    },
  },
  plugins: [],
};
