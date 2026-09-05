export interface Stat {
  maxStatAttackPower?: number // 최대 스탯공격력
  minStatAttackPower?: number // 최소 스탯공격력
  damage?: number // 데미지
  bossMonsterDamage?: number // 보스 몬스터 데미지
  finalDamage?: number // 최종 데미지
  ignoreDefenseRate?: number // 방어율 무시
  criticalRate?: number // 크리티컬 확률
  criticalDamage?: number // 크리티컬 데미지
  abnormalStatusResistance?: number // 상태이상 내성
  stance?: number // 스탠스
  defense?: number // 방어력
  moveSpeed?: number // 이동속도
  jumpPower?: number // 점프력
  starForce?: number // 스타포스
  arcaneForce?: number // 아케인포스
  authenticForce?: number // 어센틱포스
  str: number // STR
  dex: number // DEX
  int: number // INT
  luk: number // LUK
  hp?: number // HP
  mp?: number // MP
  apStr?: number // AP 배분 STR
  apDex?: number // AP 배분 DEX
  apInt?: number // AP 배분 INT
  apLuk?: number // AP 배분 LUK
  apHp?: number // AP 배분 HP
  apMp?: number // AP 배분 MP
  itemDropRate?: number // 아이템 드롭률
  mesoAcquisition?: number // 메소 획득량
  buffDuration?: number // 버프 지속시간
  attackSpeed?: number // 공격 속도
  normalMonsterDamage?: number // 일반 몬스터 데미지
  cooldownReductionPercent?: number // 재사용 대기시간 감소 (%)
  cooldownReductionSeconds?: number // 재사용 대기시간 감소 (초)
  cooldownExemption?: number // 재사용 대기시간 미적용
  ignoreAttributeResistance?: number // 속성 내성 무시
  abnormalStatusAdditionalDamage?: number // 상태이상 추가 데미지
  weaponMastery?: number // 무기 숙련도
  additionalExp?: number // 추가 경험치 획득
  attackPower?: number // 공격력
  magicPower?: number // 마력
  combatPower?: number // 전투력
  summonDurationIncrease?: number // 소환수 지속시간 증가
  remainAp?: number // 남은 AP 포인트
}
