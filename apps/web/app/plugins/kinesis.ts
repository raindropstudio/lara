import { kinesisPlugin } from '@letstri/kinesis'

export default defineNuxtPlugin<Record<string, never>>((nuxtApp) => {
  nuxtApp.vueApp.use(kinesisPlugin)
})
