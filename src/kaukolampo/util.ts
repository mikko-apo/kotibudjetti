export function debug(input: any, label?: string): void {
  const root = label ?? 'value'
  console.log(`${root}:`, JSON.stringify(input, null, 2))
}

export function toDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

export async function shortHexHash(input: string, length?: number): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)

  const buffer = await crypto.subtle.digest('SHA-256', data)

  const full = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('') // 64 hex chars

  if (length === undefined) {
    return full
  }

  if (length < 0 || length > full.length) {
    throw new Error(`Length must be between 0 and ${full.length}`)
  }

  return full.slice(0, length)
}
