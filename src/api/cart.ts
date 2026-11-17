import { serializeCart, type CartLine } from '../cart/cookie'

async function simulateNetworkConditions(): Promise<void> {
  if (!import.meta.env.DEV) return

  const latency = Number(import.meta.env.VITE_FAKE_LATENCY_MS ?? 0)
  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency))
  }

  const failureRate = Number(import.meta.env.VITE_FAKE_FAILURE_RATE ?? 0)
  if (Math.random() < failureRate) {
    throw new Error('Simulated cart API failure')
  }
}

export async function saveCart(lines: CartLine[]): Promise<void> {
  await simulateNetworkConditions()

  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: serializeCart(lines),
  })

  if (!response.ok) {
    throw new Error(`Cart API responded with ${response.status}`)
  }
}
