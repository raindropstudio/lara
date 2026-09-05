import { MemoryDataStore, semanticHash } from '@lara/data-store'
import type { CollectionQueue } from '@lara/jobs'
import { createApp } from './app.js'
import { startServer } from './server.js'

// 실제 Nexon 호출이나 영속 저장 없이 화면의 성공·부분 성공·실패를 재현한다.
const store = new MemoryDataStore()
const names = [
  '데모라라',
  '데모비숍',
  '데모제로',
  '데모궁수',
  '데모도적',
  '데모부분',
]
const seed = async (nickname: string) => {
  const index = names.indexOf(nickname)
  const ocid = `preview-${index}`
  const observedAt = new Date().toISOString()
  await store.upsertCharacterIdentity({ ocid, nickname, observedAt })
  const sections: Record<string, unknown> = {
    characterBasic: {
      ocid,
      nickname,
      worldName: '스카니아',
      gender: '여',
      class: ['라라', '비숍', '제로', '보우마스터', '나이트로드', '라라'][
        index
      ],
      classLevel: '6',
      level: 280 + index,
      exp: '0',
      expRate: 30.5,
      guildName: '미리보기',
      imageUrl: '',
      dateCreate: '2024-01-01T00:00:00.000Z',
      accessFlag: true,
    },
    characterStat: {
      str: 1000,
      dex: 1000,
      int: 53000,
      luk: 1000,
      apInt: 1400,
      combatPower: 85000000 + index * 5000000,
      bossMonsterDamage: 330 + index,
      ignoreDefenseRate: 95.2 + index / 10,
      criticalRate: 100,
      criticalDamage: 80 + index,
      starForce: 310,
      arcaneForce: 1320,
      authenticForce: 330 + index * 10,
    },
    userUnion: {
      unionLevel: 8500 + index * 100,
      unionArtifactLevel: 30,
      unionArtifactExp: 0,
      unionArtifactPoint: 0,
    },
    characterItemEquipment: [
      {
        presetNo: 1,
        active: true,
        itemEquipmentInfo: [
          {
            name: '제네시스 무기',
            part: '무기',
            slot: '무기',
            starforce: 22,
            potentialOptionGrade: 'LEGENDARY',
            potentialOption: [
              '마력 : +12%',
              '보스 몬스터 공격 시 데미지 : +40%',
            ],
            additionalPotentialOption: ['마력 : +12%'],
          },
          {
            name: '리스트레인트 링',
            part: '반지',
            slot: '반지1',
            specialRingLevel: 4,
          },
          {
            name: '에테르넬 메이지햇',
            part: '모자',
            slot: '모자',
            starforce: 22,
            potentialOption: ['INT : +12%'],
          },
          {
            name: '미트라의 분노',
            part: '엠블렘',
            slot: '엠블렘',
            potentialOption: ['마력 : +12%'],
          },
        ],
      },
    ],
  }
  const equipment = sections.characterItemEquipment as {
    itemEquipmentInfo: Record<string, unknown>[]
  }[]
  for (const preset of equipment)
    preset.itemEquipmentInfo = preset.itemEquipmentInfo.map((item) => ({
      potentialOption: [],
      additionalPotentialOption: [],
      ...item,
    }))
  if (nickname === '데모부분') delete sections.characterStat
  for (const [endpointId, value] of Object.entries(sections)) {
    await store.updateCharacterSection({
      ocid,
      endpointId,
      attempt: {
        fetchId: 'preview',
        parseRunId: 'preview',
        status: 'complete',
        observedAt,
        parserVersion: 'preview',
        issues: [],
      },
      value,
      valueHash: semanticHash(endpointId, 'preview', value),
    })
  }
}
for (const name of names) await seed(name)
const queue: CollectionQueue = {
  async enqueueCollection(job) {
    // 실제 큐와 마찬가지로 POST가 먼저 queued 상태를 반환한다.
    setTimeout(() => {
      void (async () => {
        if (!names.includes(job.nickname)) {
          await store.failCollectionRun({
            runId: job.runId,
            stepId: 'resolve',
            updatedAt: new Date().toISOString(),
            message:
              '미리보기 캐릭터가 아닙니다. 데모라라, 데모비숍, 데모부분을 사용하세요.',
          })
          return
        }
        await store.startCollectionRun({
          runId: job.runId,
          total: 1,
          updatedAt: new Date().toISOString(),
        })
        await seed(job.nickname)
        await store.recordCollectionStep({
          runId: job.runId,
          stepId: 'preview',
          outcome: job.nickname === '데모부분' ? 'partial' : 'succeeded',
          updatedAt: new Date().toISOString(),
        })
      })()
    }, 300)
  },
}
const server = await startServer(
  createApp({
    store,
    queue,
    corsOrigins: ['http://localhost:3003', 'http://127.0.0.1:3003'],
  }),
  { hostname: '127.0.0.1', port: 3002 },
)
console.info(
  '합성 데이터 API: http://127.0.0.1:3002 · 캐릭터: ' + names.join(', '),
)
process.once('SIGINT', () => {
  void server.stop()
})
process.once('SIGTERM', () => {
  void server.stop()
})
