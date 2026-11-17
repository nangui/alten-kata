<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import CartIndicator from './components/CartIndicator.vue'
import CartToast from './components/CartToast.vue'
import ProductList from './components/ProductList.vue'

const loadCartDrawer = () => import('./components/CartDrawer.vue')
const CartDrawer = defineAsyncComponent(loadCartDrawer)

const cartOpen = ref(false)
const cartRequested = ref(false)

function openCart() {
  cartRequested.value = true
  cartOpen.value = true
}
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__brand" href="/">Kata E-shop</a>
      <CartIndicator @open="openCart" @intent="loadCartDrawer" />
    </div>
  </header>
  <main class="page">
    <h1 class="page__title">Catalogue</h1>
    <ProductList />
  </main>
  <CartToast />
  <CartDrawer v-if="cartRequested" :open="cartOpen" @close="cartOpen = false" />
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid #e5e7eb;
}

.site-header__inner,
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding-inline: clamp(1rem, 5vw, 4rem);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 4rem;
}

.site-header__brand {
  color: inherit;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
}

.site-header__brand:focus-visible {
  outline: 2px solid #1e3a8a;
  outline-offset: 2px;
}

.page {
  padding-block: 2rem;
}

.page__title {
  margin: 0 0 1rem;
  font-size: 1.75rem;
}
</style>
