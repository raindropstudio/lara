<template>
  <CharacterStatCard>
    <div class="flex items-center justify-around">
      <!-- 차트 -->
      <div class="size-32">
        <Radar :data="chartData" :options="chartOptions" />
      </div>

      <!-- 레벨 표시 -->
      <div class="flex flex-col text-sm">
        <div
          v-for="(level, stat) in propensityLevels"
          :key="stat"
          class="flex items-center justify-between gap-4"
        >
          <span class="text-lucidgray-dark">{{ propensityLabels[stat] }}</span>
          <span class="font-medium text-lucidviolet-700">{{ level }}</span>
        </div>
      </div>
    </div>
  </CharacterStatCard>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
} from 'chart.js'
import { Radar } from 'vue-chartjs'
import type { Propensity } from '~/types/propensity.type'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  RadarController,
)

const props = defineProps<{
  propensity: Propensity
}>()

// 성향 레벨 매핑
const propensityLevels = computed(() => ({
  charisma: props.propensity.charismaLevel,
  sensibility: props.propensity.sensibilityLevel,
  insight: props.propensity.insightLevel,
  willingness: props.propensity.willingnessLevel,
  handicraft: props.propensity.handicraftLevel,
  charm: props.propensity.charmLevel,
}))

// 성향 한글 라벨
const propensityLabels = {
  charisma: '카리스마',
  sensibility: '감성',
  insight: '통찰력',
  willingness: '의지',
  handicraft: '손재주',
  charm: '매력',
}

// 차트 데이터
const chartData = computed(() => ({
  labels: Object.values(propensityLabels),
  datasets: [
    {
      data: Object.values(propensityLevels.value),
      fill: true,
      backgroundColor: 'rgb(139 92 246 / 0.25)',
      borderColor: 'rgb(139 92 246 / 0.5)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(139 92 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(139 92 246)',
    },
  ],
}))

// 차트 옵션
const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  layout: {
    padding: {
      top: 4,
      bottom: 4,
    },
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
        display: false,
      },
      grid: {
        color: 'rgb(139 92 246 / 0.1)',
      },
      angleLines: {
        color: 'rgb(139 92 246 / 0.1)',
      },
      pointLabels: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}
</script>
