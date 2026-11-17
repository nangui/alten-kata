<script setup lang="ts">
import { computed } from 'vue'
import type { ProductSummary } from '../api/types'

const props = defineProps<{
  product: ProductSummary
  priority?: boolean
}>()

const emit = defineEmits<{
  add: [id: number]
}>()

const ratingPercent = computed(() => `${(props.product.rating / 5) * 100}%`)
const ratingLabel = computed(() => `Note : ${props.product.rating.toFixed(1)} sur 5`)
const formattedPrice = computed(() => props.product.price.toFixed(2).replace('.', ','))
const addLabel = computed(() => `Ajouter au panier : ${props.product.title}`)
</script>

<template>
  <article class="product-card">
    <div class="product-card__media">
      <img
        :src="product.thumbnail"
        :alt="product.title"
        width="300"
        height="300"
        :loading="priority ? 'eager' : 'lazy'"
        decoding="async"
      />
    </div>

    <h2 class="product-card__title">{{ product.title }}</h2>

    <p class="product-card__rating" role="img" :aria-label="ratingLabel">
      <span class="product-card__stars" aria-hidden="true">★★★★★</span>
      <span
        class="product-card__stars product-card__stars--filled"
        :style="{ width: ratingPercent }"
        aria-hidden="true"
        >★★★★★</span
      >
    </p>

    <p class="product-card__price">
      {{ formattedPrice }}<span class="product-card__currency">€</span>
    </p>
    <button
      type="button"
      class="product-card__add"
      :aria-label="addLabel"
      @click="emit('add', product.id)"
    >
      Ajouter au panier
    </button>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.product-card__media {
  padding: 1rem;
  border-radius: 12px;
  background: #f3f4f6;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease;
}

.product-card__media img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.product-card__title {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.product-card__rating {
  position: relative;
  width: fit-content;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1;
  letter-spacing: 1px;
}

.product-card__stars {
  color: #d1d5db;
}

.product-card__stars--filled {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  color: #1e3a8a;
  white-space: nowrap;
}

.product-card__price {
  margin: auto 0 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.product-card__currency {
  margin-left: 0.2em;
  font-size: 0.6em;
  vertical-align: super;
}

.product-card__add {
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #111827;
  border-radius: 999px;
  color: #111827;
  background: transparent;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.product-card__add:hover {
  color: #ffffff;
  background: #111827;
}

.product-card__add:focus-visible {
  outline: 2px solid #1e3a8a;
  outline-offset: 2px;
}

@media (hover: hover) {
  .product-card:hover .product-card__media {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -12px rgb(17 24 39 / 0.25);
  }
}

.product-card:focus-within .product-card__media {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -12px rgb(17 24 39 / 0.25);
}

@media (prefers-reduced-motion: reduce) {
  .product-card__media,
  .product-card__add {
    transition: none;
  }

  .product-card:hover .product-card__media,
  .product-card:focus-within .product-card__media {
    transform: none;
  }
}
</style>
