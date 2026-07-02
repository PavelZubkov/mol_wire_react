import { defineConfig } from 'rolldown'

export default defineConfig({
  transform: {
    decorator: {
      legacy: true,
    },
  },
})
