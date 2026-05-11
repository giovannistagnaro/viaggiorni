export function pickByDate<T>(date: string, salt: string, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pickByDate: items array is empty')
  }
  let h = 5381
  const seed = `${date}:${salt}`
  for (let i = 0; i < seed.length; i++) {
    h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0
  }
  return items[h % items.length]
}
