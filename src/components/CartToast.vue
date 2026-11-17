<script setup lang="ts">
import { useCartStore } from '../stores/cart'

const cart = useCartStore()
</script>

<template>
  <div class="cart-toast-region" role="alert">
    <div v-if="cart.status === 'error'" class="cart-toast">
      <p class="cart-toast__message">
        Votre panier n’a pas pu être enregistré. Vos derniers ajouts ont été retirés.
      </p>
      <div class="cart-toast__actions">
        <button type="button" class="cart-toast__button" @click="cart.retry()">Réessayer</button>
        <button
          type="button"
          class="cart-toast__button cart-toast__button--ghost"
          @click="cart.dismissError()"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-toast-region {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 10;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.cart-toast {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  max-width: 32rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  color: #ffffff;
  background: #111827;
  box-shadow: 0 12px 32px -12px rgb(17 24 39 / 0.45);
  pointer-events: auto;
}

.cart-toast__message {
  flex: 1 1 16rem;
  margin: 0;
  font-size: 0.875rem;
}

.cart-toast__actions {
  display: flex;
  gap: 0.5rem;
}

.cart-toast__button {
  padding: 0.375rem 0.875rem;
  border: 1px solid #ffffff;
  border-radius: 999px;
  color: #111827;
  background: #ffffff;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.cart-toast__button--ghost {
  color: #ffffff;
  background: transparent;
}

.cart-toast__button:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}
</style>
