// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    'vuetify-nuxt-module',
    'nuxt-auth-utils',
  ],

  vuetify: {
    moduleOptions: {
      importComposables: true,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#7C4DFF',
              secondary: '#448AFF',
              accent: '#FF6D00',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FFC107',
              background: '#121212',
              surface: '#1E1E1E',
            },
          },
        },
      },
      icons: {
        defaultSet: 'mdi',
      },
    },
  },

  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || 'super-secret-password-change-this-in-production-32chars',
    },
  },
})
