import { inject, type InjectionKey } from 'vue'
import type { ProductPage } from '../api/types'

export interface AppData {
  page: number
  productPage: ProductPage
}

export const APP_DATA_KEY: InjectionKey<AppData> = Symbol('app-data')

export function useAppData(): AppData {
  const data = inject(APP_DATA_KEY)
  if (!data) {
    throw new Error('useAppData() was called but no app data was provided')
  }
  return data
}
