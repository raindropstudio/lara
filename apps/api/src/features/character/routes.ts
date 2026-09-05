import type { DataStore } from '@lara/data-store'
import { Elysia, t } from 'elysia'

import { toLegacyCharacter } from './legacy.js'
import {
  characterNotFoundSchema,
  characterViewSchema,
  legacyCharacterSchema,
} from './schema.js'
import { findCharacterView } from './view.js'

export const characterRoutes = (store: DataStore) => {
  const params = t.Object({
    nickname: t.String({ minLength: 1, maxLength: 32 }),
  })
  const characterViewOptions = {
    params,
    response: {
      200: characterViewSchema,
      404: characterNotFoundSchema,
    },
  }

  return new Elysia({ name: 'character-routes' })
    .get(
      '/characters/:nickname',
      async ({ params, status }) => {
        const character = await findCharacterView(store, params.nickname)
        if (!character)
          return status(404, {
            code: 'CHARACTER_NOT_FOUND' as const,
            message: '캐릭터를 찾을 수 없습니다.',
          })
        return character
      },
      characterViewOptions,
    )
    .get(
      '/character/:nickname',
      async ({ params, query, set, status }) => {
        const character = await findCharacterView(store, params.nickname)
        if (!character)
          return status(404, {
            code: 'CHARACTER_NOT_FOUND' as const,
            message: '캐릭터를 찾을 수 없습니다.',
          })

        const legacyCharacter = toLegacyCharacter(character)
        if (!legacyCharacter)
          return status(404, {
            code: 'CHARACTER_NOT_FOUND' as const,
            message: '캐릭터를 찾을 수 없습니다.',
          })

        set.headers['x-lara-compatibility'] = 'legacy-flat-read-only'
        set.headers['x-lara-incomplete-sections'] = String(
          legacyCharacter.incompleteSections,
        )
        set.headers['x-lara-stale-sections'] = String(
          legacyCharacter.staleSections,
        )
        if (query.update !== undefined) {
          set.headers.warning =
            '299 lara "update query is deprecated and ignored"'
          set.headers['x-lara-update-ignored'] = 'true'
        }

        return legacyCharacter.data
      },
      {
        params,
        query: t.Object({ update: t.Optional(t.String()) }),
        response: {
          200: legacyCharacterSchema,
          404: characterNotFoundSchema,
        },
      },
    )
}
