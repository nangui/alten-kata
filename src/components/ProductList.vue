<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import { useAppData } from '../composables/useAppData'

const { productPage } = useAppData()

const EAGER_IMAGES = 4
</script>

<template>
  <section>
    <p class="product-count">{{ productPage.products.length }} produits sur {{ productPage.total }}</p>
    <ul class="product-grid">
      <li v-for="(product, index) in productPage.products" :key="product.id">
        <ProductCard :product="product" :priority="index < EAGER_IMAGES" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.product-count {
  margin: 1.5rem 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 2rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem 1.25rem;
  }
}
</style>
