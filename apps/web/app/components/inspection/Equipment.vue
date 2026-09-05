<template>
  <details class="inspection-equipment">
    <summary :aria-label="`${item.name} 상세 옵션`">
      <img v-if="item.icon" :src="getItemImageUrl(item.icon)" alt="" />
      <span v-if="!compact || !item.icon" class="equipment-name">{{
        item.name
      }}</span>
      <span v-if="item.specialRingLevel" class="ring-level">{{
        item.specialRingLevel
      }}</span>
      <span v-else-if="!compact && item.starforce" class="equipment-stars"
        >★ {{ item.starforce }}</span
      >
    </summary>
    <div class="equipment-options">
      <strong>{{ item.name }}</strong>
      <p v-for="option in item.potentialOption" :key="option">{{ option }}</p>
      <p
        v-for="option in item.additionalPotentialOption"
        :key="option"
        class="text-emerald-700"
      >
        {{ option }}
      </p>
      <p
        v-if="
          !item.potentialOption?.length &&
          !item.additionalPotentialOption?.length
        "
      >
        잠재능력 정보 없음
      </p>
      <p v-if="item.dateExpire">만료: {{ item.dateExpire }}</p>
    </div>
  </details>
</template>
<script setup lang="ts">
import type { ItemEquipmentInfo } from '~/types/itemEquipment.type'
defineProps<{ item: ItemEquipmentInfo; compact?: boolean }>()
</script>
<style scoped>
.inspection-equipment {
  min-width: 0;
  max-width: 100%;
}
summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  border-radius: 8px;
  padding: 4px;
}
summary::-webkit-details-marker {
  display: none;
}
summary:hover {
  background: #eeebf5;
}
summary img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  image-rendering: pixelated;
}
.equipment-name {
  width: 100%;
  font-size: 11px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.ring-level {
  font-size: 18px;
  font-weight: 700;
  margin-left: -8px;
  align-self: flex-end;
}
.equipment-stars {
  font-size: 10px;
  color: #c19957;
}
.equipment-options {
  padding: 10px;
  margin-top: 6px;
  background: #f1eef8;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.8;
  text-align: left;
  overflow-wrap: anywhere;
}
.equipment-options strong {
  display: block;
  margin-bottom: 6px;
}
</style>
