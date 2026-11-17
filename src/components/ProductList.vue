<script setup lang="ts">
import { useAppData } from '../composables/useAppData'

const { productPage } = useAppData()
</script>

<template>
  <section>
    <p>{{ productPage.products.length }} produits sur {{ productPage.total }}</p>
    <ul>
      <li v-for="product in productPage.products" :key="product.id">
        {{ product.title }} — {{ product.price.toFixed(2) }} $
      </li>
    </ul>
  </section>
</template>
