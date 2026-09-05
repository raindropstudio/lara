import { toCharacter } from '../app/utils/characterAdapter'
export const testCharacter = (nickname = '라라') =>
  toCharacter({
    ocid: nickname,
    nickname,
    aliases: [],
    updatedAt: new Date().toISOString(),
    sections: {
      basic: {
        status: 'complete',
        observedAt: new Date().toISOString(),
        parserVersion: 'test',
        stale: false,
        issues: [],
        data: {
          ocid: nickname,
          nickname,
          worldName: '스카니아',
          gender: '여',
          class: '라라',
          classLevel: '6',
          level: 280,
          exp: '0',
          expRate: 0,
          imageUrl: '',
        },
      },
    },
  })
