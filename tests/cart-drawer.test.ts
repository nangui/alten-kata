import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'
import CartDrawer from '../src/components/CartDrawer.vue'
import { useCartStore } from '../src/stores/cart'

async function renderDrawer(open: boolean, lines: { id: number; qty: number }[] = []) {
  const app = createSSRApp({ render: () => h(CartDrawer, { open }) })
  const pinia = createPinia()
  app.use(pinia)
  useCartStore(pinia).lines = lines
  return renderToString(app)
}

describe('CartDrawer', () => {
  it('renders nothing inside the dialog while it is closed', async () => {
    const html = await renderDrawer(false, [{ id: 1, qty: 1 }])

    expect(html).toContain('<dialog')
    expect(html).not.toContain('Votre panier')
  })

  it('shows an empty state with a way back to the catalogue', async () => {
    const html = await renderDrawer(true)

    expect(html).toContain('Votre panier est vide.')
    expect(html).toContain('Continuer mes achats')
  })

  it('lists each line with quantity controls named after the product', async () => {
    const html = await renderDrawer(true, [{ id: 7, qty: 3 }])

    expect(html).toContain('aria-label="Quantité : 3"')
    expect(html).toContain('Supprimer')
    expect(html).not.toContain('Votre panier est vide.')
  })
})
