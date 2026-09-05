<template>
  <div>
    <div class="flex flex-col py-12">
      <!-- 헤더 영역 -->
      <div class="flex items-end justify-between">
        <UiSectionTitle>V MATRIX</UiSectionTitle>
      </div>

      <!-- 스킬 그리드 영역 -->
      <div class="my-12 flex flex-col items-start justify-center gap-y-12">
        <div class="flex w-full flex-wrap items-start justify-evenly gap-y-12">
          <CharacterSkillIconView
            title="스킬 코어"
            :skills="cores.skill"
            class="px-4"
          />
          <CharacterSkillIconView
            title="직업군 공용코어"
            :skills="cores.class"
            class="px-4"
          />
        </div>
        <div class="flex w-full flex-wrap items-start justify-evenly gap-y-12">
          <CharacterSkillIconView
            :title="`${cores.special[0]?.name ? '특수 코어 : ' + cores.special[0]?.name : '특수 코어'}`"
            :skills="cores.special"
            :slot-count="1"
            class="px-4"
          />
          <CharacterSkillIconView
            title="보스 코어"
            :skills="cores.boss"
            :slot-count="1"
            class="px-4"
          />
        </div>
        <div class="flex w-full flex-wrap items-start justify-evenly gap-y-12">
          <CharacterSkillIconView
            title="강화 코어"
            :skills="cores.enhance"
            :max-level="60"
            class="px-4"
          />
          <CharacterSkillIconView
            title="공용 코어"
            :skills="cores.common"
            class="px-4"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  character?: Character
}>()

const { character } = toRefs(props)

// V매트릭스 스킬만 필터링 (grade가 '5'인 스킬)
const vSkills = computed(
  () =>
    character.value?.skill?.filter((skill: Skill) => skill.grade === '5') ?? [],
)
const vCores = computed(
  () =>
    character.value?.skillCore?.filter((core) => core.skillCore.grade === 5) ??
    [],
)

// 스킬 이름으로 스킬 정보를 찾는 함수
const findSkillByName = (name: string | undefined) => {
  if (!name) return null
  return vSkills.value.find((skill) => skill.name === name) ?? null
}

// 스킬 타입별로 분류
const cores = computed(() => {
  const cores = {
    skill: [] as Skill[],
    class: [] as Skill[],
    special: [] as Skill[],
    boss: [] as Skill[],
    enhance: [] as Skill[],
    common: [] as Skill[],
  }

  // 스킬 이름으로 분류 매핑
  const coreMap = {
    class: [
      // 전직 계열별 직업군 스킬
      '오라 웨폰',
      '바디 오브 스틸', // 전사
      '오버로드 마나',
      '에테리얼 폼', // 마법사
      '가이디드 애로우',
      '크리티컬 리인포스', // 궁수
      '베놈 버스트',
      '레디 투 다이', // 도적
      '로디드 다이스',
      '오버 드라이브', // 해적

      // 소속별 직업군 스킬
      '블리츠 실드', // 모험가 전사
      '언스태이블 메모라이즈',
      '메모리 초이스', // 모험가 마법사
      '이볼브', // 모험가 궁수
      '얼티밋 다크 사이트', // 모험가 도적
      '파이렛 플래그', // 모험가 해적
      '시그너스 팔랑크스', // 시그너스 기사단
      '레지스탕스 라인 인팬트리', // 레지스탕스
      '콜 마스테마', // 데몬
      '프리드의 가호', // 영웅
      '판테온', // 노바
      '매직 서킷 풀드라이브', // 레프
      '트랜센던트', // 초월자
      '이계의 잔상', // 프렌즈 월드
      '화중군자', // 아니마
      '새벽의 진 집결', // 새벽의 진
      '윤회의 고리',
      '운명의 힘', // 강호

      // 여신의 축복
      '메이플월드 여신의 축복', // 모험가/레지스탕스/영웅
      '여제 시그너스의 축복',
      '초월자 시그너스의 축복', // 시그너스 기사단
      '이계 여신의 축복', // 데몬/키네시스
      '그란디스 여신의 축복', // 노바/레프/아니마
      '초월자 륀느의 기원', // 제로
      '사쿠노 공주의 축복', // 새벽의 진
    ],
    boss: ['스파이더 인 미러', '크레스트 오브 더 솔라'],
    common: ['쓸만한', '에르다', '블링크', '로프 커넥트'],
  }

  vCores.value.forEach((core) => {
    if (core.skillCore.coreType === '특수코어') {
      const skill = getVSkillInfo(core.skillCore.coreName)
      if (skill) {
        cores.special.push(skill)
      }
    } else if (
      core.skillCore?.coreSkill &&
      coreMap.boss.includes(core.skillCore.coreSkill[0] ?? '')
    ) {
      const skill = findSkillByName(core.skillCore.coreSkill[0] ?? '')
      if (skill) {
        cores.boss.push(skill)
      }
    } else if (
      core.skillCore.coreType === '스킬코어' &&
      core.skillCore?.coreSkill
    ) {
      const skillName = core.skillCore.coreSkill[0] ?? ''
      const isClassSkill = coreMap.class.some((prefix) =>
        skillName.startsWith(prefix),
      )
      const isCommonSkill = coreMap.common.some((prefix) =>
        skillName.startsWith(prefix),
      )

      const skill = findSkillByName(skillName)
      if (skill) {
        if (isClassSkill) cores.class.push(skill)
        else if (isCommonSkill) cores.common.push(skill)
        else cores.skill.push(skill)
      }
    }
  })

  // 강화 코어 - 스킬코어 타입이 '강화코어' 인 스킬
  // 중복 제거
  const enhanceSkill = vCores.value
    .filter((core) => core.skillCore?.coreType === '강화코어')
    .map((core) => core.skillCore.coreSkill)
    .flat()
    .filter(Boolean) // null/undefined 제거
    .filter((skill, index, self) => self.indexOf(skill) === index) // 중복 제거

  cores.enhance = enhanceSkill
    .map((skill) => findSkillByName(skill))
    .filter((skill) => skill !== null)

  // 각자 레벨로 정렬
  cores.skill.sort((a, b) => a.level - b.level)
  cores.class.sort((a, b) => a.level - b.level)
  cores.special.sort((a, b) => a.level - b.level)
  cores.boss.sort((a, b) => a.level - b.level)
  cores.enhance.sort((a, b) => a.level - b.level)
  cores.common.sort((a, b) => a.level - b.level)

  return cores
})
</script>
