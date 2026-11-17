<script setup lang='ts'>
import { useCounterStore } from './stores/counter';

const counter = useCounterStore()
</script>

<template>
  <h1>Kata E-shop SSR</h1>
  <button type="button" @click="counter.increment()">Clics : {{ counter.count }}</button>
</template>
