<template>
  <div
    class="overflow-x-auto rounded-2xl border border-lucidviolet-100 bg-white"
    tabindex="0"
    role="region"
    aria-label="캐릭터 비교표, 좌우로 스크롤할 수 있습니다"
  >
    <table
      class="w-full table-fixed border-collapse text-center text-sm text-lucidviolet-600"
      :style="{ minWidth: `${120 + entries.length * 180}px` }"
    >
      <caption class="sr-only">
        캐릭터 능력치와 현재 착용 장비 비교
      </caption>
      <colgroup>
        <col class="w-[120px]" />
        <col v-for="entry in entries" :key="entry.nickname" />
      </colgroup>
      <thead>
        <tr class="bg-lucidviolet-50/80">
          <th
            scope="col"
            class="sticky left-0 z-10 bg-lucidviolet-50 p-4 text-left"
          >
            비교 항목
          </th>
          <th
            v-for="entry in entries"
            :key="entry.nickname"
            scope="col"
            class="p-4 font-bold"
          >
            {{ entry.nickname }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.label"
          class="border-t border-lucidviolet-50"
        >
          <th
            scope="row"
            class="sticky left-0 z-10 bg-white p-4 text-left text-xs font-medium text-lucidgray-dark"
          >
            {{ row.label }}
          </th>
          <td
            v-for="(value, index) in row.values"
            :key="entries[index]?.nickname"
            class="px-3 py-5 font-semibold tabular-nums"
            :class="
              value !== undefined && value === comparisonMaximum(row.values)
                ? 'text-pink-500'
                : ''
            "
          >
            {{ formatInspectionNumber(value, row.unit) }}
          </td>
        </tr>
        <tr
          v-for="label in detailLabels"
          :key="label"
          class="border-t border-lucidviolet-50"
        >
          <th
            scope="row"
            class="sticky left-0 z-10 bg-white p-4 text-left text-xs font-medium text-lucidgray-dark"
          >
            {{ label }}
          </th>
          <td
            v-for="entry in entries"
            :key="entry.nickname"
            class="px-3 py-4 text-xs leading-5"
          >
            {{
              inspectionDetails(entry.character).find(
                (row) => row.label === label,
              )?.value ?? '—'
            }}
          </td>
        </tr>
        <tr>
          <th
            :colspan="entries.length + 1"
            scope="colgroup"
            class="bg-lucidviolet-50/60 px-4 py-4 text-left font-semibold"
          >
            현재 착용 장비
            <span class="ml-2 text-xs font-normal text-lucidgray-dark"
              >장비를 눌러 상세 옵션 확인</span
            >
          </th>
        </tr>
        <tr
          v-for="slot in slots"
          :key="slot"
          class="border-t border-lucidviolet-50"
        >
          <th
            scope="row"
            class="sticky left-0 z-10 bg-white p-4 text-left text-xs font-medium text-lucidgray-dark"
          >
            {{ slot }}
          </th>
          <td
            v-for="entry in entries"
            :key="entry.nickname"
            class="px-3 py-3 align-top"
          >
            <details v-if="item(entry, slot)" class="group">
              <summary
                class="flex cursor-pointer list-none flex-col items-center gap-1 rounded-lg p-1 hover:bg-lucidviolet-50"
              >
                <img
                  v-if="item(entry, slot)?.icon"
                  :src="getItemImageUrl(item(entry, slot)?.icon)"
                  alt=""
                  class="h-9 max-w-12 object-contain [image-rendering:pixelated]"
                />
                <span class="text-xs font-semibold">{{
                  item(entry, slot)?.name
                }}</span>
                <span
                  v-if="item(entry, slot)?.starforce !== undefined"
                  class="text-xs text-amber-600"
                  >★ {{ item(entry, slot)?.starforce }}</span
                >
                <span
                  v-if="item(entry, slot)?.specialRingLevel"
                  class="text-xs text-lucidviolet-500"
                  >Lv. {{ item(entry, slot)?.specialRingLevel }}</span
                >
              </summary>
              <div
                class="mt-2 rounded-lg bg-lucidviolet-50 p-2 text-left text-xs leading-5"
              >
                <p
                  v-for="option in item(entry, slot)?.potentialOption"
                  :key="option"
                >
                  {{ option }}
                </p>
                <p
                  v-for="option in item(entry, slot)?.additionalPotentialOption"
                  :key="option"
                  class="text-emerald-700"
                >
                  {{ option }}
                </p>
                <p
                  v-if="
                    !item(entry, slot)?.potentialOption?.length &&
                    !item(entry, slot)?.additionalPotentialOption?.length
                  "
                >
                  잠재능력 정보 없음
                </p>
                <p v-if="item(entry, slot)?.dateExpire">
                  만료: {{ item(entry, slot)?.dateExpire }}
                </p>
              </div>
            </details>
            <span v-else class="block py-4 text-lucidgray-medium">—</span>
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
  comparisonMaximum,
  formatInspectionNumber,
} from '~/utils/inspection'
const detailLabels = [
  '주스탯',
  '장비',
  '어빌리티',
  '하이퍼스탯',
  '시드링',
  'V 코어',
  '특수 코어',
  'HEXA 코어',
  '링크스킬',
]
const props = defineProps<{ entries: InspectionEntry[] }>()
const rows = computed(() => [
  {
    label: '레벨',
    values: props.entries.map((entry) => entry.character?.level),
    unit: '',
  },
  ...inspectionStats.map((row) => ({
    ...row,
    values: props.entries.map((entry) => entry.character?.stat[row.key]),
  })),
  {
    label: '유니온',
    values: props.entries.map((entry) => entry.character?.union?.unionLevel),
    unit: '',
  },
])
const equipment = computed(
  () =>
    new Map(
      props.entries.map((entry) => [
        entry.nickname,
        inspectionEquipment(entry.character),
      ]),
    ),
)
const slots = computed(() =>
  inspectionEquipmentSlots.filter((slot) =>
    props.entries.some((entry) => item(entry, slot)),
  ),
)
const item = (entry: InspectionEntry, slot: string) =>
  equipment.value.get(entry.nickname)?.find((item) => item.slot === slot)
</script>
