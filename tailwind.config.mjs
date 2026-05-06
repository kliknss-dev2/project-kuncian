export default {
  content: ['./src/**/*.{astro,html,js,jsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', '"Arial Rounded MT Bold"', '"Trebuchet MS"', 'sans-serif'],
        body: ['"Nunito"', '"Trebuchet MS"', 'sans-serif'],
        monoish: ['"Space Mono"', '"Courier New"', 'monospace']
      },
      boxShadow: {
        saw: '8px 8px 0 #222222',
        'saw-sm': '5px 5px 0 #222222',
        pressed: '3px 3px 0 #222222'
      }
    }
  },
  plugins: []
};
