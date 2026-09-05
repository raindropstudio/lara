<template>
  <div>
    <KinesisContainer>
      <section
        class="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden"
      >
        <KinesisElement
          class="absolute inset-0 flex items-center justify-center"
          type="translate"
          :strength="10"
        >
          <img
            class="pointer-events-none mb-[400px] mr-[900px] w-80 select-none object-cover opacity-50 blur-sm"
            src="~/assets/spirit/sun_spirit.png"
            alt="background"
          />
        </KinesisElement>
        <KinesisElement
          class="absolute inset-0 flex items-center justify-center"
          type="translate"
          :strength="30"
        >
          <img
            class="pointer-events-none ml-[900px] mt-[200px] w-96 select-none object-cover opacity-50 blur-[2px]"
            src="~/assets/spirit/river_spirit.png"
            alt="background"
          />
        </KinesisElement>
        <KinesisElement
          class="absolute inset-0 flex items-center justify-center"
          type="translate-inv"
          :strength="15"
        >
          <img
            class="pointer-events-none mr-[1200px] mt-[500px] w-56 select-none object-cover opacity-50 blur-[6px]"
            src="~/assets/spirit/cloud_spirit_left.png"
            alt="background"
          />
        </KinesisElement>
        <KinesisElement
          class="absolute inset-0 flex items-center justify-center"
          type="translate-inv"
          :strength="10"
        >
          <img
            class="pointer-events-none mb-[500px] ml-[1200px] w-48 select-none object-cover opacity-50 blur"
            src="~/assets/spirit/land_spirit_left.png"
            alt="background"
          />
        </KinesisElement>
        <div
          class="z-10 flex w-full flex-1 flex-col items-center justify-center"
        >
          <div class="my-2 flex flex-col items-center justify-center">
            <h1
              class="font-['lato'] text-9xl font-thin tracking-widest text-amber-500"
            >
              lara.moe
            </h1>
            <h2 class="text-xl tracking-[0.45rem] text-lucidviolet-800">
              메이플스토리 종합 데이터분석 서비스
              <span class="text-amber-500">라라모에</span>
            </h2>
          </div>
          <div
            class="my-4 flex w-full items-center justify-center text-3xl font-thin text-lucidviolet-700"
          >
            라라가 열심히 공사중!
          </div>
        </div>
        <div class="my-auto flex h-20 items-center justify-center">
          <div class="relative">
            <div
              class="absolute h-[29px] w-[7px] rounded-[15px] bg-lucidviolet-200"
            />
            <div
              class="absolute h-[15px] w-[7px] rounded-[15px] bg-sunnyorange/70"
            />
          </div>
        </div>
      </section>
    </KinesisContainer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'lara.moe',
})
</script>
