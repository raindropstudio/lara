import type { treaty, Treaty } from '@elysia/eden'
import type { App } from '@lara/api/eden'

export type ApiClient = ReturnType<typeof treaty<App>>
export type CharacterView = Treaty.Data<
  ReturnType<ReturnType<ApiClient['characters']>['get']>
>
export type CollectionRun = Treaty.Data<
  ReturnType<ReturnType<ApiClient['collection-runs']>['get']>
>
