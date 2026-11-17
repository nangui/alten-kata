<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import ProductCard from './ProductCard.vue'
import ProductPagination from './ProductPagination.vue'
import { pageCount, parsePage } from '../api/pagination'
import { useAppData } from '../composables/useAppData'
import { useProductCatalog } from '../composables/useProductCatalog'
import { useCartStore } from '../stores/cart'

const { page, productPage, status, loadPage } = useProductCatalog(useAppData())
const cart = useCartStore()

const totalPages = computed(() => pageCount(productPage.value.total))
const listTop = useTemplateRef<HTMLElement>('listTop')
const listStatus = useTemplateRef<HTMLElement>('listStatus')

const EAGER_IMAGES = 4

async function navigate(target: number) {
  const loaded = await loadPage(target)
  if (!loaded) return

  history.pushState(null, '', `?page=${target}`)
  showListTop()
}

function showListTop() {
  listTop.value?.scrollIntoView({ block: 'start' })
  listStatus.value?.focus({ preventScroll: true })
}

async function onPopState() {
  const target = parsePage(new URLSearchParams(location.search).get('page'))
  if (target === page.value) return

  const loaded = await loadPage(target)
  if (loaded) {
    showListTop()
  } else {
    history.replaceState(null, '', `?page=${page.value}`)
  }
}

onMounted(() => window.addEventListener('popstate', onPopState))
onBeforeUnmount(() => window.removeEventListener('popstate', onPopState))
</script>

<template>
  <section ref="listTop" class="product-list">
    <p ref="listStatus" class="product-count" tabindex="-1">
      Page {{ page }} : {{ productPage.products.length }} produits sur {{ productPage.total }}
    </p>

    <p v-if="status === 'error'" class="product-list__error" role="alert">
      Impossible de charger cette page. Vérifiez votre connexion puis réessayez.
    </p>

    <p v-if="productPage.products.length === 0" class="product-list__empty">
      Aucun produit sur cette page. <a href="?page=1">Revenir à la première page</a>
    </p>

    <ul class="product-grid" :aria-busy="status === 'loading'">
      <li v-for="(product, index) in productPage.products" :key="product.id">
        <ProductCard :product="product" :priority="index < EAGER_IMAGES" @add="cart.add" />
      </li>
    </ul>

    <ProductPagination
      v-if="productPage.products.length > 0"
      :page="page"
      :page-count="totalPages"
      @navigate="navigate"
    />
  </section>
</template>

<style scoped>
.product-list {
  scroll-margin-top: 1rem;
}

.product-count {
  margin: 1.5rem 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.product-count:focus {
  outline: none;
}

.product-list__error {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #991b1b;
  background: #fef2f2;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 2rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
  transition: opacity 150ms ease;
}

.product-grid[aria-busy='true'] {
  opacity: 0.5;
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-grid {
    transition: none;
  }
}
</style>
