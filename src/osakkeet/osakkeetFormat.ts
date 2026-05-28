type FixedValue = {
  toFixed: (precision?: number) => string
}

export function euro(value: FixedValue) {
  return `${value.toFixed(2)}\u00A0€`
}

export function amount(value: FixedValue) {
  return value.toFixed(2)
}

export function percentage(value: FixedValue) {
  return `${value.toFixed(2)} %`
}

export function multiplier(value: FixedValue) {
  return `${value.toFixed(2)}x`
}
