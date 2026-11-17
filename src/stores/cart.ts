import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { saveCart } from '../api/cart'
import { MAX_LINES, MAX_QTY, type CartLine } from '../cart/cookie'

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])

  const count = computed(() => lines.value.reduce((total, line) => total + line.qty, 0))

  let saveQueue: Promise<void> = Promise.resolve()

  function persist(): Promise<void> {
    const snapshot = lines.value.map((line) => ({ ...line }))
    const save = saveQueue.then(() => saveCart(snapshot))
    saveQueue = save.catch(() => {})
    return save
  }

  function add(id: number): Promise<void> {
    const line = lines.value.find((item) => item.id === id)

    if (line) {
      line.qty = Math.min(line.qty + 1, MAX_QTY)
    } else if (lines.value.length < MAX_LINES) {
      lines.value.push({ id, qty: 1 })
    }

    return persist()
  }

  return { lines, count, add }
})
