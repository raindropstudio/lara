<template>
  <nav>
    <div
      class="mx-auto flex h-20 max-w-screen-xl items-center justify-between gap-4 p-4"
    >
      <div class="flex flex-1 items-center">
        <NuxtLink to="/" class="hover:drop-shadow-lg">
          <img
            src="~/assets/spirit/ssun_logo.webp"
            alt="lara logo"
            class="size-12"
          />
        </NuxtLink>
      </div>
      <div class="hidden sm:block">
        <div class="flex gap-2 text-lg text-lucidviolet-700">
          <NuxtLink
            v-for="(link, idx) in links"
            :key="idx"
            :to="link.disabled ? '' : link.path"
            :class="getLinkClass(link.path) + ' rounded-lg p-2'"
          >
            {{ link.name }}
          </NuxtLink>
        </div>
      </div>
      <div class="flex flex-1 items-center justify-end gap-2">
        <button
          class="group flex h-8 w-10 items-center gap-3 rounded-md border-lucidviolet-400 bg-transparent px-2 text-left text-lucidviolet-400 hover:border-sunnyorange hover:text-lucidviolet-700 sm:w-16 sm:border-2 lg:w-64"
          @click="onSearch"
        >
          <IconSearch class="size-8 group-hover:text-sunnyorange sm:size-5" />
          <div class="hidden flex-1 cursor-text items-center gap-1 sm:flex">
            <span
              class="inline-flex h-4 min-w-4 items-center justify-center rounded bg-gray-100 px-1 text-xs font-medium ring-1 ring-inset ring-lucidviolet-300"
            >
              /
            </span>
            <span class="hidden lg:block"> 를 눌러 바로 검색 </span>
          </div>
        </button>
        <HPopover v-slot="{ open }" class="sm:hidden">
          <HPopoverButton
            ref="menuButton"
            class="group inline-flex h-8 w-10 items-center px-2 text-center text-lg text-lucidviolet-400 hover:text-sunnyorange"
            :aria-pressed="open"
          >
            <span class="sr-only">Menu</span>
            <svg
              class="pointer-events-none size-6 fill-current"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                class="origin-center translate-x-[7px] translate-y-[-5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-[[aria-pressed=true]]:translate-x-0 group-[[aria-pressed=true]]:translate-y-0 group-[[aria-pressed=true]]:rotate-[315deg]"
                y="7"
                width="9"
                height="1.75"
                rx="1"
              />
              <rect
                class="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-[[aria-pressed=true]]:rotate-45"
                y="7"
                width="16"
                height="1.75"
                rx="1"
              />
              <rect
                class="origin-center translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-[[aria-pressed=true]]:translate-y-0 group-[[aria-pressed=true]]:rotate-[135deg]"
                y="7"
                width="9"
                height="1.75"
                rx="1"
              />
            </svg>
          </HPopoverButton>
          <HPopoverPanel
            class="absolute right-0 top-0 z-20 mt-20 w-screen bg-lucid-light text-center shadow-lg"
          >
            <NuxtLink
              v-for="(link, idx) in links"
              :key="idx"
              :to="link.path"
              class="block px-4 py-2 text-lg hover:bg-lucidviolet-50"
              :class="getLinkClass(link.path)"
            >
              {{ link.name }}
            </NuxtLink>
          </HPopoverPanel>
        </HPopover>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const route = useRoute()

const links = [
  { name: '캐릭터', path: '/character' },
  { name: '군장검사', path: '/', disabled: true },
  { name: '코디', path: '/', disabled: true },
  { name: '지표', path: '/', disabled: true },
  { name: '도구', path: '/', disabled: true },
]

const getLinkClass = (linkPath: string) => {
  return links.find((link) => link.path === linkPath)?.disabled
    ? 'cursor-not-allowed text-lucidviolet-300'
    : route.path.startsWith(linkPath)
      ? 'text-amber-500 hover:text-amber-600 hover:bg-lucidviolet-50'
      : 'text-lucidviolet-700 hover:text-amber-600 hover:bg-lucidviolet-50'
}

const onSearch = () => {
  navigateTo('/character')
}

const handleSlash = (e: KeyboardEvent) => {
  if (e.key === '/') {
    e.preventDefault()
    onSearch()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleSlash)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleSlash)
})
</script>
