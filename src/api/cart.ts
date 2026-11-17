import { serializeCart, type CartLine } from '../cart/cookie'

export async function saveCart(lines: CartLine[]): Promise<void> {
  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: serializeCart(lines),
  })

  if (!response.ok) {
    throw new Error(`Cart API responded with ${response.status}`)
  }
}
