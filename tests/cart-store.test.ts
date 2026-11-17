import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../src/stores/cart'
import { MAX_QTY } from '../src/cart/cookie'

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a new line, then increments it instead of duplicating it', () => {
    const cart = useCartStore()

    cart.add(12)
    cart.add(12)
    cart.add(5)

    expect(cart.lines).toEqual([{ id: 12, qty: 2 }, { id: 5, qty: 1 }])
    expect(cart.count).toBe(3)
  })

  it(`caps a line at ${MAX_QTY}`, () => {
    const cart = useCartStore()
    cart.lines = [{ id: 12, qty: MAX_QTY }]

    cart.add(12)

    expect(cart.lines[0].qty).toBe(MAX_QTY)
  })
})
