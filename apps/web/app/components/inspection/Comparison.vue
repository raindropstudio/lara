<template>
  <div class="inspection-comparison">
    <table class="summary-table">
      <caption class="sr-only">
        캐릭터 능력치와 현재 착용 장비 비교
      </caption>
      <thead class="sr-only">
        <tr>
          <th v-for="entry in entries" :key="entry.nickname" scope="col">
            {{ entry.nickname }}
          </th>
        </tr>
      </thead>
      <tbody v-for="row in summaryRows" :key="row.label">
        <tr>
          <th :colspan="entries.length" scope="colgroup">{{ row.label }}</th>
        </tr>
        <tr>
          <td
            v-for="(value, index) in row.values"
            :key="entries[index]?.nickname"
            :class="{
              highest:
                value !== undefined && value === comparisonMaximum(row.values),
            }"
          >
            <span v-if="row.label === '주스탯'" class="stat-kind">{{
              inspectionMainStat(entries[index]?.character).label
            }}</span>
            <span :title="formatInspectionNumber(value, row.unit)">{{
              row.compact
                ? compactNumber(value)
                : formatInspectionNumber(value, row.unit)
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <table class="summary-table equipment-summary">
      <caption class="sr-only">
        특수 장비와 포스
      </caption>
      <thead class="sr-only">
        <tr>
          <th v-for="entry in entries" :key="entry.nickname" scope="col">
            {{ entry.nickname }}
          </th>
        </tr>
      </thead>
      <tbody v-for="group in equipmentGroups" :key="group.label">
        <tr>
          <th :colspan="entries.length" scope="colgroup">{{ group.label }}</th>
        </tr>
        <tr>
          <td v-for="entry in entries" :key="entry.nickname">
            <div class="equipment-pair" v-if="group.items(entry).length">
              <InspectionEquipment
                v-for="item in group.items(entry)"
                :key="item.slot"
                :item="item"
                compact
              />
            </div>
            <span v-else>—</span>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr>
          <th :colspan="entries.length" scope="colgroup">아케인 · 어센틱</th>
        </tr>
        <tr>
          <td v-for="entry in entries" :key="entry.nickname">
            {{ formatInspectionNumber(entry.character?.stat.arcaneForce) }} ·
            {{ formatInspectionNumber(entry.character?.stat.authenticForce) }}
          </td>
        </tr>
      </tbody>
    </table>
    <details class="extra-stats">
      <summary>세부 능력치 · 스킬 <span aria-hidden="true">⌄</span></summary>
      <table class="summary-table">
        <caption class="sr-only">
          세부 능력치와 스킬 비교
        </caption>
        <tbody v-for="row in extraRows" :key="row.label">
          <tr>
            <th :colspan="entries.length" scope="colgroup">{{ row.label }}</th>
          </tr>
          <tr>
            <td
              v-for="(value, index) in row.values"
              :key="entries[index]?.nickname"
              :class="{
                highest:
                  value !== undefined &&
                  value === comparisonMaximum(row.values),
              }"
            >
              {{ formatInspectionNumber(value, row.unit) }}
            </td>
          </tr>
        </tbody>
        <tbody v-for="label in detailLabels" :key="label">
          <tr>
            <th :colspan="entries.length" scope="colgroup">{{ label }}</th>
          </tr>
          <tr>
            <td
              v-for="entry in entries"
              :key="entry.nickname"
              class="detail-value"
            >
              {{
                inspectionDetails(entry.character).find(
                  (row) => row.label === label,
                )?.value ?? '—'
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
    <div class="equipment-heading">
      <h2>현재 착용 장비</h2>
      <p>장비를 눌러 상세 옵션을 확인하세요.</p>
    </div>
    <table class="summary-table all-equipment">
      <caption class="sr-only">
        현재 착용 장비 상세 비교
      </caption>
      <thead>
        <tr>
          <th v-for="entry in entries" :key="entry.nickname" scope="col">
            {{ entry.nickname }}
          </th>
        </tr>
      </thead>
      <tbody v-for="slot in slots" :key="slot">
        <tr>
          <th :colspan="entries.length" scope="colgroup">{{ slot }}</th>
        </tr>
        <tr>
          <td v-for="entry in entries" :key="entry.nickname">
            <InspectionEquipment
              v-if="item(entry, slot)"
              :item="item(entry, slot)!"
            /><span v-else>—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import type { InspectionEntry } from '~/composables/useInspection'
import {
  inspectionStats,
  inspectionDetails,
  inspectionEquipmentSlots,
  inspectionEquipment,
  inspectionMainStat,
  comparisonMaximum,
  formatInspectionNumber,
} from '~/utils/inspection'
const props = defineProps<{ entries: InspectionEntry[] }>()
const summaryRows = computed(() => [
  {
    label: '전투력',
    values: props.entries.map((entry) => entry.character?.stat.combatPower),
    unit: '',
    compact: true,
  },
  {
    label: '주스탯',
    values: props.entries.map(
      (entry) => inspectionMainStat(entry.character).value,
    ),
    unit: '',
    compact: true,
  },
  {
    label: '방어율 무시',
    values: props.entries.map(
      (entry) => entry.character?.stat.ignoreDefenseRate,
    ),
    unit: '%',
    compact: false,
  },
  {
    label: '유니온',
    values: props.entries.map((entry) => entry.character?.union?.unionLevel),
    unit: '',
    compact: false,
  },
])
const compactNumber = (value?: number) =>
  value === undefined || !Number.isFinite(value)
    ? '—'
    : value >= 100000000
      ? `${Number((value / 100000000).toFixed(2))}억`
      : value >= 10000
        ? `${Number((value / 10000).toFixed(1))}만`
        : formatInspectionNumber(value)
const extraRows = computed(() =>
  inspectionStats
    .filter(
      (row) =>
        ![
          'combatPower',
          'ignoreDefenseRate',
          'arcaneForce',
          'authenticForce',
        ].includes(row.key),
    )
    .map((row) => ({
      ...row,
      values: props.entries.map((entry) => entry.character?.stat[row.key]),
    })),
)
const detailLabels = [
  '장비',
  '어빌리티',
  '하이퍼스탯',
  'V 코어',
  '특수 코어',
  'HEXA 코어',
  '링크스킬',
]
const equipment = computed(
  () =>
    new Map(
      props.entries.map((entry) => [
        entry.nickname,
        inspectionEquipment(entry.character),
      ]),
    ),
)
const item = (entry: InspectionEntry, slot: string) =>
  equipment.value.get(entry.nickname)?.find((item) => item.slot === slot)
const slots = computed(() =>
  inspectionEquipmentSlots.filter((slot) =>
    props.entries.some((entry) => item(entry, slot)),
  ),
)
const equipmentGroups = [
  {
    label: '특수반지',
    items: (entry: InspectionEntry) =>
      (equipment.value.get(entry.nickname) ?? []).filter(
        (item) => (item.specialRingLevel ?? 0) > 0,
      ),
  },
  {
    label: '훈장 · 칭호',
    items: (entry: InspectionEntry) =>
      (equipment.value.get(entry.nickname) ?? []).filter((item) =>
        ['훈장', '칭호'].includes(item.slot),
      ),
  },
]
</script>
<style scoped>
.inspection-comparison {
  color: #888397;
}
.summary-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: center;
  background: #fff;
}
.summary-table tbody {
  border-bottom: 1px solid #eeedf3;
}
.summary-table tbody:last-child {
  border-bottom: 0;
}
.summary-table th {
  font-weight: 400;
  font-size: 14px;
  color: #bbb8c3;
  padding: 20px 8px 0;
}
.summary-table td {
  padding: 4px 8px 24px;
  font-size: 22px;
  font-weight: 650;
  vertical-align: top;
  overflow-wrap: anywhere;
}
.summary-table td.highest {
  color: #ed4a9f;
}
.stat-kind {
  display: block;
  font-size: 13px;
  color: #bbb8c3;
  font-weight: 400;
  line-height: 1.2;
}
.equipment-summary {
  background: transparent;
  margin-top: 24px;
}
.equipment-summary td {
  vertical-align: middle;
}
.equipment-pair {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
  flex-wrap: wrap;
}
.extra-stats {
  margin: 28px 0;
  color: #9f98ae;
}
.extra-stats > summary {
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  padding: 16px;
  list-style: none;
}
.extra-stats > summary span {
  margin-left: 8px;
}
.summary-table .detail-value {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.8;
}
.equipment-heading {
  text-align: center;
  padding: 24px 0 18px;
}
.equipment-heading h2 {
  font-size: 20px;
  font-weight: 650;
  color: #9086a8;
}
.equipment-heading p {
  margin-top: 8px;
  font-size: 11px;
  color: #b7b0c1;
}
.all-equipment {
  background: transparent;
}
.all-equipment thead th {
  color: #8c819f;
  font-size: 13px;
  padding-bottom: 16px;
}
.all-equipment td {
  padding-top: 10px;
  padding-bottom: 16px;
}
@media (max-width: 639px) {
  .summary-table td {
    font-size: 20px;
  }
  .summary-table th {
    font-size: 12px;
  }
}
</style>
