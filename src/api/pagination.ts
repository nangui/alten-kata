import { PAGE_SIZE } from './client'

const PAGE_PATTERN = /^[1-9]\d{0,3}$/

export function parsePage(value: string | null): number {
  return value !== null && PAGE_PATTERN.test(value) ? Number(value) : 1
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}
