import { describe, expect, it } from 'vitest'
import { pageCount, parsePage } from '../src/api/pagination'

describe('parsePage', () => {
  it('reads a valid page number', () => {
    expect(parsePage('3')).toBe(3)
  })

  it.each([null, '', '0', '-2', '1.5', 'abc'])('falls back to page 1 for %j', (value) => {
    expect(parsePage(value)).toBe(1)
  })
})

describe('pageCount', () => {
  it('rounds up so the last partial page is reachable', () => {
    expect(pageCount(194)).toBe(7)
  })

  it('never returns less than one page', () => {
    expect(pageCount(0)).toBe(1)
  })
})
