<template>
  <div
    class="min-h-screen bg-lucid-light selection:bg-amber-500/30 selection:text-amber-900"
  >
    <NuxtLoadingIndicator
      color="repeating-linear-gradient(to right,#ffd688 0%,#ffb944 50%,#ffa220 100%)"
    />
    <div class="">
      <MainNav />
      <NuxtPage
        :keepalive="{ exclude: [], max: 10 }"
        class="min-h-[calc(100vh-80px)]"
      />
      <MainFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
// Headless UI가 SSR에서도 같은 ID를 사용하게 한다.
provideHeadlessUseId(() => useId())
</script>
