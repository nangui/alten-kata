<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'

const emit = defineEmits<{
  open: []
  intent: []
}>()

const cart = useCartStore()

const itemsLabel = computed(() => `${cart.count} ${cart.count > 1 ? 'articles' : 'article'}`)
</script>

<template>
  <div aria-live="polite">
    <button
      type="button"
      class="cart-indicator"
      aria-haspopup="dialog"
      @click="emit('open')"
      @pointerenter="emit('intent')"
      @focus="emit('intent')"
    >
      Panier
      <span class="cart-indicator__count" aria-hidden="true">{{ cart.count }}</span>
      <span class="visually-hidden">{{ itemsLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.cart-indicator {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0.5rem 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.cart-indicator:hover {
  border-color: #d1d5db;
}

.cart-indicator:focus-visible {
  outline: 2px solid #1e3a8a;
  outline-offset: 2px;
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
