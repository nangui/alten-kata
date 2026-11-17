import { describe, it, expect } from 'vitest'
import { createApp } from '../src/main'
import { render } from '../src/entry-server'
import { useCounterStore } from '../src/stores/counter'

describe('SSR invariants', () => {
  it('createApp() returns a fresh Pinia on every call', () => {
    const a = createApp()
    const b = createApp()

    useCounterStore(a.pinia).increment()

    expect(a.pinia).not.toBe(b.pinia)
    expect(useCounterStore(b.pinia).count).toBe(0)
  })

  it('render() returns the HTML and a { data, state } payload', async () => {
    const { html, payload } = await render('/')

    expect(html).toContain('Clics : 10')
    expect(payload.data).toEqual({})
    expect(payload.state.counter).toEqual({ count: 10 })
  })
})

