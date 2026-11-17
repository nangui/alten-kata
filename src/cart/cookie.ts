export interface CartLine {
  id: number
  qty: number
}

export const MAX_QTY = 99
export const MAX_LINES = 50

const LINE_PATTERN = /^(\d{1,9}):(\d{1,2})$/

export function parseCart(value: string | undefined): CartLine[] {
  if (!value) return []

  const lines: CartLine[] = []
  const seen = new Set<number>()

  for (const part of value.split(',')) {
    const match = LINE_PATTERN.exec(part)
    if (!match) continue

    const id = Number(match[1])
    const qty = Number(match[2])
    if (id < 1 || qty < 1 || seen.has(id)) continue

    seen.add(id)
    lines.push({ id, qty })
    if (lines.length === MAX_LINES) break
  }

  return lines
}

export function serializeCart(lines: CartLine[]): string {
  return lines.map((line) => `${line.id}:${line.qty}`).join(',')
}
