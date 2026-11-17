import { describe, expect, it } from 'vitest'
import { MAX_LINES, parseCart, serializeCart } from '../src/cart/cookie'

describe('cart cookie', () => {
  it('round-trips the cart lines', () => {
    const lines = [
      { id: 12, qty: 2 },
      { id: 5, qty: 1 },
    ]

    expect(serializeCart(lines)).toBe('12:2,5:1')
    expect(parseCart(serializeCart(lines))).toEqual(lines)
  })

  it('returns an empty cart when there is no cookie', () => {
    expect(parseCart(undefined)).toEqual([])
    expect(parseCart('')).toEqual([])
  })

  it('drops malformed, zero and duplicate lines but keeps the valid ones', () => {
    expect(parseCart('12:2,abc,0:3,7:0,12:5,9:100,5:1')).toEqual([
      { id: 12, qty: 2 },
      { id: 5, qty: 1 },
    ])
  })

  it(`never reads more than ${MAX_LINES} lines`, () => {
    const oversized = Array.from({ length: MAX_LINES + 10 }, (_, i) => `${i + 1}:1`).join(',')

    expect(parseCart(oversized)).toHaveLength(MAX_LINES)
  })
})
