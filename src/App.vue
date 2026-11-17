<script setup lang="ts">
import ProductList from './components/ProductList.vue'
import { useCounterStore } from './stores/counter'

const counter = useCounterStore()
</script>

<template>
  <main class="page">
    <h1 class="page__title">Kata E-shop SSR</h1>
    <button type="button" @click="counter.increment()">Clics : {{ counter.count }}</button>
    <ProductList />
  </main>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 5vw, 4rem);
}

.page__title {
  margin: 0 0 1rem;
  font-size: 1.75rem;
}
</style>