import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { MAX_LINES, MAX_QTY, type CartLine } from '../cart/cookie'

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])

  const count = computed(() => lines.value.reduce((total, line) => total + line.qty, 0))

  function add(id: number) {
    const line = lines.value.find((item) => item.id === id)

    if (line) {
      line.qty = Math.min(line.qty + 1, MAX_QTY)
    } else if (lines.value.length < MAX_LINES) {
      lines.value.push({ id, qty: 1 })
    }
  }

  return { lines, count, add }
})
