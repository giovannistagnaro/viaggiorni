export function pickByDate<T>(date: string, salt: string, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pickByDate: items array is empty')
  }
  let h = 5381
  const seed = `${date}:${salt}`
  for (let i = 0; i < seed.length; i++) {
    h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0
  }
   h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return items[h % items.length]
}
