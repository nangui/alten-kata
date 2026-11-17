import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import { fetchCartProducts } from '../api/client'
import type { CartProduct } from '../api/types'
import type { CartLine } from '../cart/cookie'

export type CartProductsStatus = 'idle' | 'loading' | 'error'

export function useCartProducts(lines: Ref<CartLine[]>, active: Ref<boolean>) {
  const products = shallowRef<Record<number, CartProduct>>({})
  const status = ref<CartProductsStatus>('idle')

  async function loadMissing() {
    const missing = lines.value.map((line) => line.id).filter((id) => !(id in products.value))
    if (missing.length === 0) return

    status.value = 'loading'
    try {
      const fetched = await fetchCartProducts(missing)
      const next = { ...products.value }
      for (const product of fetched) next[product.id] = product
      products.value = next
      status.value = 'idle'
    } catch {
      status.value = 'error'
    }
  }

  watch(
    [active, () => lines.value.map((line) => line.id).join(',')],
    ([isActive]) => {
      if (isActive) loadMissing()
    },
    { immediate: true },
  )

  const total = computed(() =>
    lines.value.reduce((sum, line) => sum + (products.value[line.id]?.price ?? 0) * line.qty, 0),
  )
  const isComplete = computed(() => lines.value.every((line) => line.id in products.value))

  return { products, status, total, isComplete, reload: loadMissing }
}
