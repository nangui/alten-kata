import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ProductCard from '../src/components/ProductCard.vue'

const product = {
  id: 1,
  title: 'Essence Mascara',
  price: 9.99,
  rating: 2.56,
  thumbnail: 'https://cdn.example/1.webp',
  category: 'beauty',
}

function renderCard(priority?: boolean) {
  return renderToString(createSSRApp({ render: () => h(ProductCard, { product, priority }) }))
}

describe('ProductCard', () => {
  it('reserves the image box with explicit width and height', async () => {
    const html = await renderCard()

    expect(html).toContain('width="300"')
    expect(html).toContain('height="300"')
  })

  it('lazy-loads images by default', async () => {
    expect(await renderCard()).toContain('loading="lazy"')
  })

  it('loads priority images eagerly so the LCP image is not delayed', async () => {
    expect(await renderCard(true)).toContain('loading="eager"')
  })

  it('formats the price in French with a superscript euro sign', async () => {
    expect(await renderCard()).toMatch(/9,99<span[^>]*>€<\/span>/)
  })

  it('leaves the image alt empty because the heading already names the product', async () => {
    expect(await renderCard()).toContain('alt=""')
  })

  it('exposes the rating as text for screen readers', async () => {
    expect(await renderCard()).toContain('aria-label="Note : 2,6 sur 5"')
  })

  it('names each add-to-cart button after its product', async () => {
    expect(await renderCard()).toContain('aria-label="Ajouter au panier : Essence Mascara"')
  })
})
