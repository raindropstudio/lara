import { treaty } from '@elysia/eden'
import type { App } from '@lara/api/eden'
import type { ApiClient } from '~/types/api.type'

export default defineNuxtPlugin<{ api: ApiClient }>(() => {
  const config = useRuntimeConfig()
  const api: ApiClient = treaty<App>(config.public.apiBaseUrl, {
    parseDate: false,
  })

  return {
    provide: {
      api,
    },
  }
})
