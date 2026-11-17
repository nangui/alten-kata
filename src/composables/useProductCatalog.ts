import { ref, shallowRef } from 'vue'
import { fetchProducts } from '../api/client'
import type { ProductPage } from '../api/types'
import type { AppData } from './useAppData'

export type CatalogStatus = 'idle' | 'loading' | 'error'

export function useProductCatalog(initial: AppData) {
  const page = ref(initial.page)
  const productPage = shallowRef<ProductPage>(initial.productPage)
  const status = ref<CatalogStatus>('idle')

  let latestRequest = 0

  async function loadPage(target: number): Promise<boolean> {
    const requestId = ++latestRequest
    status.value = 'loading'

    try {
      const result = await fetchProducts(target)
      if (requestId !== latestRequest) return false

      productPage.value = result
      page.value = target
      status.value = 'idle'
      return true
    } catch {
      if (requestId !== latestRequest) return false

      status.value = 'error'
      return false
    }
  }

  return { page, productPage, status, loadPage }
}
