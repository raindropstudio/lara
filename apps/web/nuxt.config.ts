export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    'nuxt-headlessui',
  ],
  imports: {
    dirs: ['types'],
  },
  $production: {
    scripts: {
      registry: {
        clarity: {
          id: 'p72fcmul7c',
        },
        googleAnalytics: {
          id: 'G-C00XKTBGWY',
        },
      },
    },
  },
  devtools: {
    enabled: true,
  },
  app: {
    head: {
      title: 'lara.moe',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#FFB944' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'lara.moe' },
        { property: 'og:title', content: 'lara.moe' },
        { property: 'og:image', content: '/og.png' },
        {
          name: 'description',
          content: '메이플스토리 종합 데이터 분석 서비스 라라모에',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  css: ['pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://127.0.0.1:3001',
    },
  },
  build: {
    transpile: ['hangul-typing-animation'],
  },
  devServer: {
    port: 3000,
  },
  compatibilityDate: '2026-08-31',
  headlessui: {
    prefix: 'H',
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },
})
