<script setup lang="ts">
import { onMounted, toRef, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore } from '../stores/cart'
import { useCartProducts } from '../composables/useCartProducts'
import { formatPrice } from '../utils/price'
import { MAX_QTY } from '../cart/cookie'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const cart = useCartStore()
const { lines } = storeToRefs(cart)
const { products, status, total, isComplete, reload } = useCartProducts(lines, toRef(props, 'open'))

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

function sync(open: boolean) {
  const element = dialog.value
  if (!element) return

  if (open && !element.open) element.showModal()
  if (!open && element.open) element.close()
}

onMounted(() => sync(props.open))
watch(
  () => props.open,
  (open) => sync(open),
  { flush: 'post' },
)

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="cart-drawer"
    aria-labelledby="cart-drawer-title"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <div v-if="open" class="cart-drawer__panel">
      <header class="cart-drawer__header">
        <h2 id="cart-drawer-title" class="cart-drawer__title">Votre panier</h2>
        <button
          type="button"
          class="cart-drawer__close"
          aria-label="Fermer le panier"
          autofocus
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <p v-if="cart.status === 'error'" class="cart-drawer__alert" role="alert">
        La dernière modification n’a pas pu être enregistrée et a été annulée.
        <button type="button" class="cart-drawer__link" @click="cart.retry()">Réessayer</button>
      </p>

      <div v-if="lines.length === 0" class="cart-drawer__empty">
        <p class="cart-drawer__empty-title">Votre panier est vide.</p>
        <p class="cart-drawer__empty-text">Ajoutez des produits depuis le catalogue.</p>
        <button type="button" class="cart-drawer__primary" @click="emit('close')">
          Continuer mes achats
        </button>
      </div>

      <template v-else>
        <p v-if="status === 'error'" class="cart-drawer__alert" role="alert">
          Les détails des produits n’ont pas pu être chargés.
          <button type="button" class="cart-drawer__link" @click="reload()">Réessayer</button>
        </p>

        <ul class="cart-drawer__lines" :aria-busy="status === 'loading'">
          <li v-for="line in lines" :key="line.id" class="cart-line">
            <div class="cart-line__media">
              <img
                v-if="products[line.id]"
                :src="products[line.id].thumbnail"
                alt=""
                width="64"
                height="64"
              />
            </div>

            <div class="cart-line__body">
              <p class="cart-line__title">
                <template v-if="products[line.id]">{{ products[line.id].title }}</template>
                <template v-else-if="status === 'loading'">Chargement…</template>
                <template v-else>Produit indisponible</template>
              </p>
              <p v-if="products[line.id]" class="cart-line__unit">
                {{ formatPrice(products[line.id].price) }} € l’unité
              </p>

              <div class="cart-line__controls">
                <div class="quantity" role="group" :aria-label="`Quantité : ${line.qty}`">
                  <button
                    type="button"
                    class="quantity__button"
                    :aria-label="`Retirer un exemplaire de ${products[line.id]?.title ?? 'ce produit'}`"
                    @click="cart.setQuantity(line.id, line.qty - 1)"
                  >
                    −
                  </button>
                  <span class="quantity__value" aria-hidden="true">{{ line.qty }}</span>
                  <button
                    type="button"
                    class="quantity__button"
                    :aria-label="`Ajouter un exemplaire de ${products[line.id]?.title ?? 'ce produit'}`"
                    :disabled="line.qty >= MAX_QTY"
                    @click="cart.setQuantity(line.id, line.qty + 1)"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  class="cart-drawer__link"
                  :aria-label="`Supprimer ${products[line.id]?.title ?? 'ce produit'} du panier`"
                  @click="cart.remove(line.id)"
                >
                  Supprimer
                </button>
              </div>
            </div>

            <p class="cart-line__total">
              <template v-if="products[line.id]"
                >{{ formatPrice(products[line.id].price * line.qty) }} €</template
              >
            </p>
          </li>
        </ul>

        <footer class="cart-drawer__footer">
          <p class="cart-drawer__total">
            <span>Total</span>
            <span>{{ isComplete ? `${formatPrice(total)} €` : '…' }}</span>
          </p>
          <button type="button" class="cart-drawer__secondary" @click="emit('close')">
            Continuer mes achats
          </button>
        </footer>
      </template>
    </div>
  </dialog>
</template>

<style scoped>
.cart-drawer {
  width: min(26rem, 100vw);
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0 0 0 auto;
  padding: 0;
  border: none;
  color: #111827;
  background: #ffffff;
  box-shadow: -16px 0 40px -24px rgb(17 24 39 / 0.45);
}

.cart-drawer:focus {
  outline: none;
}

.cart-drawer[open] {
  animation: slide-in 200ms ease-out;
}

.cart-drawer::backdrop {
  background: rgb(17 24 39 / 0.4);
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
}

.cart-drawer__panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.cart-drawer__title {
  margin: 0;
  font-size: 1.125rem;
}

.cart-drawer__close {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.cart-drawer__close:hover {
  background: #f3f4f6;
}

.cart-drawer__alert {
  margin: 1rem 1.25rem 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #991b1b;
  background: #fef2f2;
  font-size: 0.875rem;
}

.cart-drawer__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem;
  text-align: center;
}

.cart-drawer__empty-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.cart-drawer__empty-text {
  margin: 0 0 1rem;
  color: #6b7280;
}

.cart-drawer__lines {
  flex: 1;
  margin: 0;
  padding: 0 1.25rem;
  overflow-y: auto;
  list-style: none;
  transition: opacity 150ms ease;
}

.cart-drawer__lines[aria-busy='true'] {
  opacity: 0.6;
}

.cart-line {
  display: grid;
  grid-template-columns: 4rem 1fr auto;
  gap: 0.75rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.cart-line__media {
  width: 4rem;
  height: 4rem;
  border-radius: 8px;
  background: #f3f4f6;
}

.cart-line__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cart-line__body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.cart-line__title {
  margin: 0;
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-line__unit {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}

.cart-line__controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.25rem;
}

.cart-line__total {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.quantity {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 999px;
}

.quantity__button {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.quantity__button:hover:not(:disabled) {
  background: #f3f4f6;
}

.quantity__button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.quantity__value {
  min-width: 1.5rem;
  font-size: 0.875rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.cart-drawer__link {
  padding: 0;
  border: none;
  color: #1e3a8a;
  background: none;
  font: inherit;
  font-size: 0.8rem;
  text-decoration: underline;
  cursor: pointer;
}

.cart-drawer__footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.cart-drawer__total {
  display: flex;
  justify-content: space-between;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cart-drawer__primary,
.cart-drawer__secondary {
  padding: 0.625rem 1rem;
  border: 1px solid #111827;
  border-radius: 999px;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.cart-drawer__primary {
  color: #ffffff;
  background: #111827;
}

.cart-drawer__secondary {
  color: #111827;
  background: transparent;
}

.cart-drawer button:focus-visible {
  outline: 2px solid #1e3a8a;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .cart-drawer[open] {
    animation: none;
  }

  .cart-drawer__lines {
    transition: none;
  }
}
</style>
