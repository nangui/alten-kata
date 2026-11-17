import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { saveCart } from '../api/cart'
import { MAX_LINES, MAX_QTY, type CartLine } from '../cart/cookie'

export type CartStatus = 'idle' | 'saving' | 'error'

function copyLines(lines: CartLine[]): CartLine[] {
  return lines.map((line) => ({ ...line }))
}

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])
  const status = ref<CartStatus>('idle')

  const count = computed(() => lines.value.reduce((total, line) => total + line.qty, 0))

  let confirmed: CartLine[] | null = null
  let rejected: CartLine[] | null = null
  let hasUnsavedChanges = false
  let saving: Promise<void> | null = null

  async function saveUntilSettled(): Promise<void> {
    status.value = 'saving'

    while (hasUnsavedChanges) {
      hasUnsavedChanges = false
      const snapshot = copyLines(lines.value)

      try {
        await saveCart(snapshot)
        confirmed = snapshot
      } catch {
        rejected = copyLines(lines.value)
        lines.value = confirmed ?? []
        confirmed = null
        hasUnsavedChanges = false
        status.value = 'error'
        return
      }
    }

    confirmed = null
    status.value = 'idle'
  }

  function change(mutate: () => void): Promise<void> {
    confirmed ??= copyLines(lines.value)
    mutate()
    hasUnsavedChanges = true

    saving ??= saveUntilSettled().finally(() => {
      saving = null
    })
    return saving
  }

  function add(id: number): Promise<void> {
    rejected = null

    return change(() => {
      const line = lines.value.find((item) => item.id === id)

      if (line) {
        line.qty = Math.min(line.qty + 1, MAX_QTY)
      } else if (lines.value.length < MAX_LINES) {
        lines.value.push({ id, qty: 1 })
      }
    })
  }

  function setQuantity(id: number, qty: number): Promise<void> {
    rejected = null

    return change(() => {
      if (qty <= 0) {
        lines.value = lines.value.filter((line) => line.id !== id)
        return
      }

      const line = lines.value.find((item) => item.id === id)
      if (line) line.qty = Math.min(qty, MAX_QTY)
    })
  }

  function remove(id: number): Promise<void> {
    return setQuantity(id, 0)
  }

  function retry(): Promise<void> {
    const attempt = rejected
    if (!attempt) return Promise.resolve()

    rejected = null
    return change(() => {
      lines.value = attempt
    })
  }

  function dismissError() {
    rejected = null
    if (status.value === 'error') status.value = 'idle'
  }

  return { lines, status, count, add, setQuantity, remove, retry, dismissError }
})
