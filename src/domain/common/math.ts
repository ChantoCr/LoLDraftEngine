export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function roundTo(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return sum(values) / values.length
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}
