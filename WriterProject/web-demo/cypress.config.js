import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
    },
    baseUrl: 'http://localhost:3002',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}'
  }
})
