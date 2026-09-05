<template>
  <div class="h-32">
    <div class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center justify-center text-xs">
        <div class="text-lucidgray-dark">
          <template v-for="(link, index) in linkList" :key="link.url">
            <NuxtLink
              :to="link.url"
              no-prefetch
              target="_blank"
              class="inline-block"
            >
              {{ link.name }}
            </NuxtLink>
            <span
              v-if="index < linkList.length - 1"
              class="text-lucid-violetgray"
            >
              |
            </span>
          </template>
        </div>
        <div class="font-medium text-lucidviolet-700">
          <NuxtLink to="/character/소주에보드카" no-prefetch>
            소주에보드카<span class="text-lucid-violetgray">#비숍</span>
          </NuxtLink>
          <span class="text-lucid-violetgray"> | </span>
          <NuxtLink to="/character/섭주" no-prefetch>
            섭주<span class="text-lucid-violetgray">#패스파인더</span>
          </NuxtLink>
        </div>
        <div class="text-lucidgray-medium">
          © {{ year }}
          <NuxtLink
            to="https://raindrop.studio"
            no-prefetch
            target="_blank"
            class="inline-block"
          >
            <img
              src="~/assets/raindrop.png"
              alt="Raindrop Studio"
              class="inline-block h-3"
            />
          </NuxtLink>
          All Rights Reserved.
          <span class="text-sunnyorange">lara.moe</span>
          is not associated with NEXON Korea.
        </div>
        <div class="text-lucidgray-medium">
          Data based on
          <NuxtLink
            to="https://openapi.nexon.com/"
            no-prefetch
            target="_blank"
            class="inline-block"
          >
            <span class="text-lucid-violetgray"> NEXON Open API </span>
          </NuxtLink>
          with
          <NuxtLink
            to="https://partners.maplestory.nexon.com"
            no-prefetch
            target="_blank"
            class="inline-block"
          >
            <span class="text-lucid-violetgray"> Maplestory Partners </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const linkList = [
  { name: 'Status', url: 'https://status.lara.moe' },
  { name: 'Changelog', url: 'https://laramoe.notion.site' },
  { name: 'GitHub', url: 'https://github.com/raindropstudio' },
]

const year = computed(() => new Date().getFullYear())
</script>
