<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'

const cart = useCartStore()

const itemsLabel = computed(() => `${cart.count} ${cart.count > 1 ? 'articles' : 'article'}`)
</script>

<template>
  <p class="cart-indicator" aria-live="polite">
    Panier
    <span class="cart-indicator__count" aria-hidden="true">{{ cart.count }}</span>
    <span class="visually-hidden">{{ itemsLabel }}</span>
  </p>
</template>

<style scoped>
.cart-indicator {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-weight: 500;
}

.cart-indicator__count {
  min-width: 1.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  color: #ffffff;
  background: #1e3a8a;
  font-size: 0.875rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
